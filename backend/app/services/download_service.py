"""Download request service — validates, logs, and queues download link emails."""

import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

import httpx

from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── reCAPTCHA v3 verification ─────────────────────────────────────────────────

RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET_KEY", "")
RECAPTCHA_THRESHOLD = float(os.getenv("RECAPTCHA_THRESHOLD", "0.5"))
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


async def verify_recaptcha(token: str) -> bool:
    """Verify a reCAPTCHA v3 token with Google. Returns True if valid."""
    if not RECAPTCHA_SECRET:
        logger.warning("RECAPTCHA_SECRET_KEY not set — skipping verification")
        return True

    if not token:
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                RECAPTCHA_VERIFY_URL,
                data={"secret": RECAPTCHA_SECRET, "response": token},
            )
            result = resp.json()

        if not result.get("success", False):
            logger.warning("reCAPTCHA verification failed: %s", result.get("error-codes"))
            return False

        score = result.get("score", 0.0)
        if score < RECAPTCHA_THRESHOLD:
            logger.warning("reCAPTCHA score too low: %.2f (threshold: %.2f)", score, RECAPTCHA_THRESHOLD)
            return False

        return True
    except Exception:
        logger.exception("reCAPTCHA verification error")
        return False


# ── URL validation ────────────────────────────────────────────────────────────

_SAFE_URL_PATTERN = re.compile(r"^https?://", re.IGNORECASE)


def _is_safe_url(url: str) -> bool:
    """Only allow http(s) URLs — block javascript:, data:, etc."""
    return bool(_SAFE_URL_PATTERN.match(url.strip()))


# ── Email sending ─────────────────────────────────────────────────────────────

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success."""
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not configured — email not sent to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM or SMTP_USER
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            server.starttls()
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)

        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)

        server.sendmail(msg["From"], [to], msg.as_string())
        server.quit()
        logger.info("Download links email sent to %s", to)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def _build_download_email(
    name: str,
    documents: list[dict[str, str]],
) -> str:
    """Build HTML email body with download links."""
    safe_docs = [
        d for d in documents if _is_safe_url(d.get("url", ""))
    ]

    doc_rows = ""
    for doc in safe_docs:
        doc_name = doc.get("name", "Document")
        doc_url = doc["url"]
        doc_rows += (
            f'<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">{doc_name}</td>'
            f'<td style="padding:8px 12px;border-bottom:1px solid #eee;">'
            f'<a href="{doc_url}" style="color:#2563eb;text-decoration:underline;">Download</a>'
            f"</td></tr>"
        )

    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1e293b;">Your Requested Documents</h2>
      <p style="color:#475569;">Hi {name},</p>
      <p style="color:#475569;">
        Thank you for your interest. Here are the download links you requested:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 12px;text-align:left;font-size:14px;">Document</th>
            <th style="padding:8px 12px;text-align:left;font-size:14px;">Link</th>
          </tr>
        </thead>
        <tbody>
          {doc_rows}
        </tbody>
      </table>
      <p style="color:#94a3b8;font-size:12px;">
        If you did not request these documents, please ignore this email.
      </p>
    </div>
    """


# ── Main service function ─────────────────────────────────────────────────────


async def process_download_request(
    db: Any,
    name: str,
    email: str,
    company: str,
    country: str,
    state: str,
    requirements: str,
    how_did_you_hear: str,
    documents: list[dict[str, str]],
    recaptcha_token: str,
) -> dict[str, str]:
    """Validate reCAPTCHA, log the request, and send download links via email."""

    # 1. Verify reCAPTCHA
    is_valid = await verify_recaptcha(recaptcha_token)
    if not is_valid:
        return {"status": "error", "code": "RECAPTCHA_FAILED"}

    # 2. Filter documents to safe URLs only
    safe_documents = [d for d in documents if _is_safe_url(d.get("url", ""))]
    if not safe_documents:
        return {"status": "error", "code": "NO_VALID_DOCUMENTS"}

    # 3. Log the download request to MongoDB for analytics/audit
    from datetime import datetime, timezone

    await db.download_requests.insert_one({
        "name": name,
        "email": email,
        "company": company,
        "country": country,
        "state": state,
        "requirements": requirements,
        "how_did_you_hear": how_did_you_hear,
        "documents": safe_documents,
        "created_at": datetime.now(timezone.utc),
    })

    # 4. Send email with download links
    subject = "Your Requested Documents — e-con Systems"
    html_body = _build_download_email(name, safe_documents)
    email_sent = _send_email(email, subject, html_body)

    if not email_sent:
        logger.warning(
            "Email delivery failed for download request from %s (%s). Request logged.",
            email,
            name,
        )
        # Still return success — the request is logged and can be resent
        return {"status": "queued", "message": "Request received. Email delivery is pending."}

    return {"status": "success", "message": "Download links sent to your email."}
