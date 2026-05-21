"""Newsletter subscription service.

Flow:
1. Run the full 6-step email validation pipeline (same as download form).
2. If valid, send an internal notification to the subscription_email configured
   in the footer settings.
3. Return success / validation failure message.
"""

import asyncio
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.services.email_validation_service import validate_email
from app.utils.logger import get_logger

logger = get_logger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Sales <sales@e-consystems.com>")


# Reason codes that should return a user-friendly "invalid email" message
_VALIDATION_FAILURE_REASONS = {
    "invalid_format",
    "free_email",
    "blocked_domain",
    "email_unverifiable",
}


def _send_subscription_notification(email: str, notification_to: str) -> None:
    """Send a simple internal notification when someone subscribes."""
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not configured — subscription notification not sent for %s", email)
        return
    if not notification_to:
        logger.warning("Subscription notification_email not configured — skipping email for %s", email)
        return

    year = datetime.now().year
    body = (
        "<HTML><HEAD></HEAD><BODY>"
        '<table width="500" border="0" cellspacing="0" cellpadding="4" '
        'style="font-family:Arial,sans-serif;">'
        f'<tr><td colspan="2" bgcolor="#006786" height="40" '
        'style="color:#FFFFFF;font-size:16px;padding:8px;">'
        "<strong>New Newsletter Subscription</strong></td></tr>"
        f'<tr><td height="30" style="font-size:12px;padding-right:16px"><strong>Email</strong></td>'
        f'<td height="30" style="font-size:12px">{email}</td></tr>'
        f'<tr><td colspan="2" bgcolor="#006786" height="22" '
        f'style="color:#FFFFFF;font-size:11px;padding:4px;">'
        f"&copy; {year} e-con Systems. All Rights Reserved.</td></tr>"
        "</table></BODY></HTML>"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Newsletter Subscription — {email}"
    msg["From"] = SMTP_FROM
    msg["To"] = notification_to
    msg.attach(MIMEText(body, "html", "utf-8"))

    try:
        svr = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        svr.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            svr.login(SMTP_USER, SMTP_PASSWORD)
        svr.sendmail(SMTP_FROM, [notification_to], msg.as_string())
        svr.quit()
        logger.info("Subscription notification sent to %s for subscriber %s", notification_to, email)
    except Exception:
        logger.exception("Subscription SMTP send failed for %s", email)


async def process_subscription(email: str, notification_email: str) -> dict[str, Any]:
    """Validate email and send subscription notification.

    Returns: { status: 'success' | 'invalid' | 'error', message: str }
    """
    email = email.strip().lower()

    validation = await validate_email(email)
    if not validation.get("valid"):
        reason = validation.get("reason", "unknown")
        if reason in _VALIDATION_FAILURE_REASONS:
            return {
                "status": "invalid",
                "message": "Please enter a valid business email address.",
            }
        # zerobounce_* or other reasons
        return {
            "status": "invalid",
            "message": "We could not verify your email address. Please use a corporate email.",
        }

    # Run SMTP in thread pool — blocking call
    try:
        await asyncio.get_event_loop().run_in_executor(
            None,
            _send_subscription_notification,
            email,
            notification_email,
        )
    except Exception:
        logger.exception("Subscription notification dispatch failed for %s", email)
        # Still return success — the subscriber did nothing wrong

    return {
        "status": "success",
        "message": "Thank you for subscribing! You will receive our latest updates.",
    }
