"""Download request service â€” full production implementation.

Flow:
1. Check MongoDB rate limit (3-day window, same email + product)
2. Generate S3 pre-signed URLs for all document links
3. Add SQL lead via usp_AddLeadAutomation (skip if EU + no GDPR consent)
4. Record rate-limit entry in MongoDB (skip if EU + no GDPR consent)
5. Dispatch emails via email_dispatch_service
6. Return result
"""

import asyncio
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from app.mssql import add_blocked_user, add_lead_automation
from app.services.email_dispatch_service import dispatch_download_emails
from app.services.storage_service import generate_presigned_url
from app.utils.logger import get_logger

logger = get_logger(__name__)

# â”€â”€ EU country codes (GDPR jurisdiction) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
EU_COUNTRIES = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
    "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
    "RO", "SK", "SI", "ES", "SE",
}

# Rate-limit window: 3 days, max 3 submissions
RATE_LIMIT_DAYS = 3
RATE_LIMIT_MAX = 3

_SAFE_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


def _safe_url(url: str) -> bool:
    return bool(_SAFE_URL_RE.match(url.strip()))


# â”€â”€ MongoDB rate-limit helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async def _is_rate_limited(db: Any, email: str, product_name: str) -> bool:
    """Return True if this email+product has â‰¥ RATE_LIMIT_MAX submissions in the past 3 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=RATE_LIMIT_DAYS)
    count = await db.download_rate_limits.count_documents({
        "email": email.lower(),
        "product_name": product_name,
        "created_at": {"$gt": cutoff},
    })
    return count >= RATE_LIMIT_MAX


async def _record_rate_limit(db: Any, email: str, product_name: str, ip: str) -> None:
    await db.download_rate_limits.insert_one({
        "email": email.lower(),
        "product_name": product_name,
        "ip": ip,
        "created_at": datetime.now(timezone.utc),
    })


# â”€â”€ Build document HTML for emails â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _build_doc_html_customer(docs: list[dict], download_id: str) -> str:
    """HTML anchor links with downloadId query param â€” for customer email."""
    parts = []
    for i, doc in enumerate(docs, 1):
        url = doc.get("url", "")
        name = doc.get("name", "Document")
        separator = "&" if "?" in url else "?"
        parts.append(
            f'<br><strong>'
            f'<a href="{url}{separator}downloadId={download_id}&documentId={i}" '
            f'target="_blank" style="font-size:12px">{name}</a>'
            f'</strong>'
        )
    return "".join(parts)


def _build_doc_html_internal(docs: list[dict]) -> str:
    """HTML anchor links without downloadId â€” for internal notification."""
    parts = []
    for doc in docs:
        url = doc.get("url", "")
        name = doc.get("name", "Document")
        parts.append(
            f'<br><strong>'
            f'<a href="{url}" target="_blank" style="font-size:12px">{name}</a>'
            f'</strong>'
        )
    return "".join(parts)


# â”€â”€ Main service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async def process_download_request(
    db: Any,
    name: str,
    email: str,
    company: str,
    country: str,
    state: str,
    phone: str,
    how_did_you_hear: str,
    newsletter: bool,
    terms_accepted: bool,
    product_name: str,
    incorpid: str,
    documents: list[dict[str, str]],
    client_ip: str = "0.0.0.0",
) -> dict[str, Any]:
    """Process a document download request."""

    email = email.strip().lower()
    country_upper = country.strip().upper()

    # Determine GDPR skip: EU country + no terms consent
    is_eu_no_consent = (country_upper in EU_COUNTRIES) and (not terms_accepted)

    # â”€â”€ Filter to safe document URLs only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    safe_docs = [d for d in documents if _safe_url(d.get("url", ""))]
    if not safe_docs:
        return {"status": "error", "code": "NO_VALID_DOCUMENTS"}

    # â”€â”€ Rate limit check (skip for EU no-consent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    is_blocked = False
    if not is_eu_no_consent:
        try:
            is_blocked = await _is_rate_limited(db, email, product_name)
        except Exception:
            logger.exception("Rate limit check failed â€” continuing")

    # â”€â”€ Generate S3 pre-signed URLs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    signed_docs: list[dict[str, str]] = []
    for doc in safe_docs:
        signed_url = await asyncio.get_event_loop().run_in_executor(
            None, generate_presigned_url, doc["url"]
        )
        signed_docs.append({"name": doc["name"], "url": signed_url})

    doc_names_plain = ", ".join(d["name"] for d in signed_docs)

    # â”€â”€ SQL lead automation (skip if EU no-consent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    download_id = "0"
    if not is_eu_no_consent:
        newsletter_int = 1 if newsletter else 0
        try:
            download_id = await add_lead_automation({
                "email": email,
                "product_name": product_name,
                "company": company,
                "name": name,
                "country": country,
                "state": state,
                "city": "N/A",
                "phone": phone,
                "newsletter": newsletter_int,
                "leadsource": "Web Download",
                "knowecon": how_did_you_hear,
                "doclist": doc_names_plain,
            })
        except Exception:
            logger.exception("add_lead_automation failed")

    # â”€â”€ Record rate-limit entry (skip if EU no-consent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if not is_eu_no_consent:
        try:
            await _record_rate_limit(db, email, product_name, client_ip)
        except Exception:
            logger.exception("Rate limit record failed")

    # â”€â”€ Build email context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    newsletter_txt = (
        "Send e-con's Newsletter and updates"
        if newsletter
        else "e-con's Newsletter and updates are not Requested"
    )
    papertype_html = _build_doc_html_customer(signed_docs, download_id)
    econ_doc_list_html = _build_doc_html_internal(signed_docs)

    ctx = {
        "email": email,
        "name": name,
        "company": company,
        "country": country_upper,
        "state": state.strip().upper(),
        "phone": phone,
        "product_name": product_name,
        "papertype": papertype_html,
        "econ_doc_list": econ_doc_list_html,
        "download_id": download_id,
        "newsletter_txt": newsletter_txt,
        "incorpid": incorpid or "N/A",
        "is_blocked": is_blocked,
        "is_bot": incorpid not in ("N/A", "", None),
    }

    # â”€â”€ Send emails (non-blocking â€” run in thread) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    try:
        await asyncio.get_event_loop().run_in_executor(
            None, dispatch_download_emails, ctx
        )
    except Exception:
        logger.exception("Email dispatch failed â€” lead already saved")

    if is_blocked:
        return {
            "status": "blocked",
            "message": "Download technical document has been sent to your mail already.",
        }

    return {"status": "success", "message": "Download links sent to your email."}


async def log_blocked_email(
    name: str,
    company: str,
    email: str,
    domain: str,
    status: str,
    country: str,
    state: str,
    phone: str,
    product_name: str,
) -> None:
    """Record a blocked / invalid email validation attempt in SQL."""
    try:
        await add_blocked_user({
            "name": name,
            "company": company,
            "email": email,
            "domain": domain,
            "status": status,
            "country": country,
            "state": state,
            "city": "",
            "phone": phone,
            "psi": product_name,
        })
    except Exception:
        logger.exception("BlockedEmailUserDetails insert failed")

# â”€â”€ reCAPTCHA v3 verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET_KEY", "")
RECAPTCHA_THRESHOLD = float(os.getenv("RECAPTCHA_THRESHOLD", "0.5"))
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


async def verify_recaptcha(token: str) -> bool:
    """Verify a reCAPTCHA v3 token with Google. Returns True if valid."""
    if not RECAPTCHA_SECRET:
        logger.warning("RECAPTCHA_SECRET_KEY not set â€” skipping verification")
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


# â”€â”€ URL validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_SAFE_URL_PATTERN = re.compile(r"^https?://", re.IGNORECASE)


def _is_safe_url(url: str) -> bool:
    """Only allow http(s) URLs â€” block javascript:, data:, etc."""
    return bool(_SAFE_URL_PATTERN.match(url.strip()))


# â”€â”€ Email sending â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success."""
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not configured â€” email not sent to %s", to)
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
