"""Contact inquiry service — handles Contact Us form submissions.

Flow:
1. Add SQL lead via usp_AddLeadAutomation (leadsource='Web Contact')
2. Send internal notification email (no customer copy, no GDPR logic)
"""

import asyncio
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.mssql import add_lead_automation
from app.utils.logger import get_logger

logger = get_logger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Sales <sales@e-consystems.com>")

SALES = os.getenv("INTERNAL_EMAIL_SALES", "sales@e-consystems.com")
VENKAT = os.getenv("INTERNAL_EMAIL_VENKAT", "venkatesan.p@e-consystems.com")


def _send_internal_notification(
    name: str,
    company: str,
    email: str,
    phone: str,
    country: str,
    state: str,
    how_did_you_hear: str,
    requirements: str,
    product_name: str,
) -> None:
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not configured — contact inquiry email not sent")
        return

    rows = [
        ("Product", product_name),
        ("Company", company),
        ("Name", name),
        ("Email", email),
        ("Phone", phone),
        ("Country", country),
        ("State", state),
        ("How did you hear", how_did_you_hear),
        ("Requirements", requirements),
    ]
    row_html = "".join(
        f'<tr><td height="30" style="font-size:11px;padding-right:16px"><strong>{lbl}</strong></td>'
        f'<td height="30" style="font-size:11px">{val}</td></tr>'
        for lbl, val in rows
    )
    body = (
        "<HTML><HEAD></HEAD><BODY>"
        '<table width="600" border="0" cellspacing="0" cellpadding="4" '
        'style="font-family:Arial,sans-serif;">'
        f"{row_html}"
        "</table></BODY></HTML>"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Contact Us enquiry — {product_name or name}"
    msg["From"] = SMTP_FROM
    msg["To"] = SALES
    msg["Bcc"] = VENKAT
    msg.attach(MIMEText(body, "html", "utf-8"))

    try:
        svr = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        svr.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            svr.login(SMTP_USER, SMTP_PASSWORD)
        svr.sendmail(SMTP_FROM, [SALES, VENKAT], msg.as_string())
        svr.quit()
        logger.info("Contact inquiry email sent for %s (%s)", email, product_name)
    except Exception:
        logger.exception("Contact inquiry SMTP send failed")


async def process_contact_inquiry(
    name: str,
    email: str,
    company: str,
    phone: str,
    country: str,
    state: str,
    how_did_you_hear: str,
    requirements: str,
    product_name: str,
) -> dict[str, Any]:
    """Process a Contact Us form submission."""

    email = email.strip().lower()

    # ── SQL lead ──────────────────────────────────────────────────────────────
    try:
        await add_lead_automation({
            "email": email,
            "product_name": product_name,
            "company": company,
            "name": name,
            "country": country,
            "state": state,
            "city": "N/A",
            "phone": phone,
            "newsletter": 0,
            "leadsource": "Web Contact",
            "knowecon": how_did_you_hear,
            "doclist": "",
        })
    except Exception:
        logger.exception("Contact inquiry add_lead_automation failed")

    # ── Internal email (run in thread — SMTP is blocking) ─────────────────────
    try:
        await asyncio.get_event_loop().run_in_executor(
            None,
            _send_internal_notification,
            name, company, email, phone, country, state,
            how_did_you_hear, requirements, product_name,
        )
    except Exception:
        logger.exception("Contact inquiry email dispatch failed")

    return {"status": "success", "message": "Your inquiry has been received. Our team will contact you shortly."}
