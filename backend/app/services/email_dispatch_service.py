"""Email dispatch service — mirrors the ASP / download-email.ts routing logic.

Routing matrix:
  Bot (ZeroBounce non-corporate) → detail block only
  Blocked (rate limited)         → nothing
  JP/UNI country, internal       → detail block
  JP/UNI country, competitor     → competitor email + local only to customer
  JP/UNI country, normal         → internal + JpUni copy + customer
  USA / AK state, internal       → detail block (AK)
  USA / AK state, competitor     → local only
  USA / AK state, normal         → detail block (AK) + local only to customer
  normal, internal               → detail block
  normal, competitor             → competitor email + local only
  normal                         → internal notification + customer copy

All INTERNAL_EMAIL_* vars point to venkatesan.p@e-consystems.com during testing.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── SMTP config ───────────────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Sales <sales@e-consystems.com>")

# ── Recipient aliases ─────────────────────────────────────────────────────────
SALES = os.getenv("INTERNAL_EMAIL_SALES", "sales@e-consystems.com")
VENKAT = os.getenv("INTERNAL_EMAIL_VENKAT", "venkatesan.p@e-consystems.com")
SATHIS = os.getenv("INTERNAL_EMAIL_SATHIS", "sathis.p@e-consystems.com")
MARKETING = os.getenv("INTERNAL_EMAIL_MARKETING", "marketing@e-consystems.com")

# ── Domain / country classification ──────────────────────────────────────────
COMPETITOR_DOMAINS = {
    "gracelabs.com", "leopardimaging.com", "pathpartnertech.com",
    "techmahindra.com", "phytec.de", "ids-imaging.com",
}
INTERNAL_DOMAINS = {"e-consystems.com", "solutionchamps.com", "sureshm.com"}
JP_UNI_COUNTRIES = {"JP", "GB", "NO"}


# ── Low-level SMTP send ───────────────────────────────────────────────────────

def _send(to: str, subject: str, html: str, bcc: str = "") -> None:
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not configured — email not sent to %s", to)
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    if bcc:
        msg["Bcc"] = bcc
    msg.attach(MIMEText(html, "html", "utf-8"))
    recipients = [a.strip() for a in to.split(",")]
    if bcc:
        recipients += [a.strip() for a in bcc.split(",")]
    try:
        svr = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        svr.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            svr.login(SMTP_USER, SMTP_PASSWORD)
        svr.sendmail(SMTP_FROM, recipients, msg.as_string())
        svr.quit()
        logger.info("Email dispatched to %s (bcc=%s)", to, bcc or "—")
    except Exception:
        logger.exception("SMTP send failed to %s", to)


# ── Email body builders ───────────────────────────────────────────────────────

def _internal_body(ctx: dict[str, Any], is_bot: bool = False, usa_ak: bool = False) -> str:
    rows = [
        ("Company Name", ctx.get("company", "")),
        ("Name", ctx.get("name", "")),
        ("Email", ctx.get("email", "")),
        ("Country", ctx.get("country", "")),
        ("State", ctx.get("state", "")),
        ("Phone", ctx.get("phone", "")),
        ("Specification", ctx.get("econ_doc_list", "")),
        ("Newsletter and Updates", ctx.get("newsletter_txt", "")),
        ("Non-Corporate Ids", ctx.get("incorpid", "N/A")),
        ("Login", "No"),
    ]
    if is_bot:
        rows.append(("Bot", "Yes"))
    if usa_ak:
        rows.append(("AK Block", "Yes"))

    row_html = "".join(
        f'<tr><td height="30"><span style="font-size:11px">{lbl}</span></td>'
        f'<td height="30">{val}</td></tr>'
        for lbl, val in rows
    )
    return (
        "<HTML><HEAD></HEAD><BODY>"
        '<table width="500" border="0" cellspacing="0" cellpadding="0">'
        f"{row_html}"
        "</table></BODY></HTML>"
    )


def _customer_body(ctx: dict[str, Any]) -> str:
    year = __import__("datetime").date.today().year
    papertype = ctx.get("papertype", "")
    name = ctx.get("name", "")
    download_id = ctx.get("download_id", "0")
    return f"""<html><head></head><body>
<table cellpadding="0" cellspacing="0" width="600" style="border:1px #6da6b1 solid;">
<tr><td align="center" valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="600">
<tr><td valign="middle" bgcolor="#006786" align="center" height="60"
  style="color:#FEE6B7;font-size:25px;font-family:Arial,Verdana,Helvetica,sans-serif">
  e-con Systems<br/>
  <span style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
    Think Camera, Think e-con!!
  </span>
</td></tr>
<tr><td valign="top"><table border="0" cellpadding="12" cellspacing="0">
<tr><td><table width="100%" cellpadding="0" cellspacing="0"><tr><td><table>
<tr><td style="font-family:Trebuchet MS;font-size:12px">Dear {name},</td></tr>
<tr><td>&nbsp;</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  Thank you for visiting us at
  <a href="https://www.e-consystems.com">www.e-consystems.com</a>
  and showing interest in downloading the information.
</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">{papertype}</td></tr>
<tr><td>&nbsp;</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  <b>You can buy the products directly from our </b>
  <a href="https://www.e-consystems.com/webstore.asp" style="color:#00622c">ONLINE STORE</a>
</td></tr>
</table></td></tr></table></td></tr></table></td></tr>
<tr><td bgcolor="#006786" style="color:#FEE6B7;" height="22">
  &nbsp;&nbsp;<strong>About e-con Systems&reg;:</strong>
</td></tr>
<tr><td height="15"><table width="100%" cellpadding="15" cellspacing="0">
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  e-con Systems&reg; is a leading OEM camera solution provider with 20+ years of experience
  and expertise in embedded vision.
</td></tr>
</table></td></tr>
<tr><td height="30" align="center" valign="middle" bgcolor="#006786"
  style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
  &copy; {year} <a href="https://www.e-consystems.com"
  style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
  e-con Systems</a> &nbsp;All Rights Reserved.
</td></tr>
</table></td></tr>
</table>
<img src="https://www.e-consystems.com/get-img-url.asp?downloadId={download_id}"
  style="width:1px;height:1px;display:none;"/>
</body></html>"""


def _competitor_body(ctx: dict[str, Any]) -> str:
    product_name = ctx.get("product_name", "")
    email = ctx.get("email", "")
    return (
        "<html><head></head><body><table><tr>"
        f'<td style="font-family:Trebuchet MS;font-size:12px">'
        f"{product_name} documents download by {email}"
        "</td></tr></table></body></html>"
    )


def _local_competitor_body(ctx: dict[str, Any]) -> str:
    """The 'local only' email sent to the customer's address when competitor / AK block."""
    product_name = ctx.get("product_name", "")
    return (
        "<html><head></head><body><table><tr>"
        f'<td style="font-family:Trebuchet MS;font-size:12px">'
        f"Download as requested for {product_name}, from e-con Systems"
        "</td></tr></table></body></html>"
    )


# ── Named send operations ─────────────────────────────────────────────────────

def _send_internal(ctx: dict[str, Any]) -> None:
    product_name = ctx.get("product_name", "")
    _send(
        SALES,
        f"Received email from {product_name} documents download",
        _internal_body(ctx),
        bcc=VENKAT,
    )


def _send_jp_uni_copy(ctx: dict[str, Any]) -> None:
    product_name = ctx.get("product_name", "")
    _send(
        VENKAT,
        f"Received email from {product_name} documents download",
        _internal_body(ctx),
    )


def _send_detail_block(ctx: dict[str, Any], usa_ak: bool = False, is_bot: bool = False) -> None:
    product_name = ctx.get("product_name", "")
    subject = (
        f"Received email from {product_name} documents download (USA and AK Mail Block)"
        if usa_ak
        else f"Received email from {product_name} documents download"
    )
    _send(f"{VENKAT}, {SATHIS}", subject, _internal_body(ctx, is_bot=is_bot, usa_ak=usa_ak))


def _send_competitor_alert(ctx: dict[str, Any]) -> None:
    _send(VENKAT, "Download from competitor", _competitor_body(ctx), bcc=MARKETING)


def _send_customer(ctx: dict[str, Any]) -> None:
    email = ctx.get("email", "")
    _send(email, "Download as requested, from e-con Systems", _customer_body(ctx))


def _send_local_only(ctx: dict[str, Any], usa_ak: bool = False) -> None:
    """Send a minimal 'local' email (competitor / AK block case) to the customer."""
    email = ctx.get("email", "")
    subject = "Download from USA and AK Block Mail" if usa_ak else "Download from competitor"
    _send(email, subject, _local_competitor_body(ctx))


# ── Main dispatch ─────────────────────────────────────────────────────────────

def dispatch_download_emails(ctx: dict[str, Any]) -> None:
    """Dispatch the correct set of emails.

    ctx keys:
      email, name, company, country, state, phone, product_name,
      papertype  — HTML links with downloadId (customer email)
      econ_doc_list — HTML links without downloadId (internal email)
      download_id, newsletter_txt, incorpid,
      is_blocked  — bool: already rate-limited
      is_bot      — bool: ZeroBounce flagged as non-corporate
    """
    if ctx.get("is_blocked"):
        return  # Rate-limited — send nothing

    email_domain = (ctx.get("email", "").split("@") + [""])[1].lower()
    is_internal = email_domain in INTERNAL_DOMAINS
    is_competitor = email_domain in COMPETITOR_DOMAINS
    is_bot = ctx.get("is_bot", False)
    country = (ctx.get("country") or "").upper()
    state = (ctx.get("state") or "").upper()
    is_usa_ak = (country == "US" and state == "AK")
    is_jp_uni = country in JP_UNI_COUNTRIES

    if is_bot:
        _send_detail_block(ctx, is_bot=True)
        return

    # Internal notification
    if is_jp_uni:
        if is_internal:
            _send_detail_block(ctx)
        elif is_competitor:
            _send_competitor_alert(ctx)
        else:
            _send_internal(ctx)
            _send_jp_uni_copy(ctx)
    elif is_usa_ak:
        if is_internal:
            _send_detail_block(ctx, usa_ak=True)
        elif is_competitor:
            _send_local_only(ctx)
        else:
            _send_detail_block(ctx, usa_ak=True)
    else:
        if is_internal:
            _send_detail_block(ctx)
        elif is_competitor:
            _send_competitor_alert(ctx)
        else:
            _send_internal(ctx)

    # Customer-facing email
    if is_usa_ak:
        if is_internal:
            _send_customer(ctx)   # detail-block copy
        elif is_competitor:
            _send_local_only(ctx)
        else:
            _send_local_only(ctx, usa_ak=True)
    else:
        if is_internal:
            _send_customer(ctx)
        elif is_competitor:
            _send_local_only(ctx)
        else:
            _send_customer(ctx)
