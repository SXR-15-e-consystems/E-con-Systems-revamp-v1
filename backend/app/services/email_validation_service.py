"""Email validation pipeline — 6-step domain/ZeroBounce check.

Step 1  – Free email domain list              → reject  'free_email'
Step 2  – InvalidDomain table (IsBlocked=1)   → reject  'blocked_domain'
Step 3  – ValidDomain table                   → pass    (skip ZeroBounce)
Step 4  – Customer.GuestEmail (econshopping)  → pass    (skip ZeroBounce)
Step 5  – AspNetUsers domain count > 0        → pass    (skip ZeroBounce)
Step 6  – ZeroBounce API                      → pass / reject

Returns a dict: { valid: bool, reason?: str, incorpid?: str }
"""

import os

import httpx

from app.mssql import check_domain, check_guest_email, count_domain_users
from app.utils.logger import get_logger

logger = get_logger(__name__)

FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
    "icloud.com", "aol.com", "mail.com", "protonmail.com", "zoho.com",
    "ymail.com", "msn.com", "rediffmail.com", "rocketmail.com", "inbox.com",
    "me.com", "mac.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.co.jp",
    "yahoo.fr", "yahoo.de", "hotmail.co.uk", "hotmail.fr",
    "windowslive.com", "googlemail.com",
}

INTERNAL_DOMAINS = {"e-consystems.com", "solutionchamps.com", "sureshm.com"}


async def validate_email(email: str) -> dict[str, str | bool]:
    """Run the full 6-step validation pipeline.

    Returns a dict with keys:
      valid  : bool
      reason : str  (only when valid=False)
      incorpid: str (only when flagged by ZeroBounce)
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        return {"valid": False, "reason": "invalid_format"}

    domain = email.split("@")[1]

    # ── Step 1: Free email block ──────────────────────────────────────────────
    if domain in FREE_EMAIL_DOMAINS:
        return {"valid": False, "reason": "free_email"}

    # ── Steps 2–5: DB checks ─────────────────────────────────────────────────
    try:
        status = await check_domain(domain)
        if status == "1":
            return {"valid": False, "reason": "blocked_domain"}
        if status == "2":
            return {"valid": True}  # Known trusted domain — skip ZeroBounce

        # Step 4: Guest email in econshopping
        if await check_guest_email(email):
            return {"valid": True}

        # Step 5: Existing domain users in AspNetUsers
        if domain in INTERNAL_DOMAINS:
            return {"valid": True}

        count = await count_domain_users(domain)
        if count > 0:
            return {"valid": True}

    except Exception:
        logger.exception("DB error during email validation for domain %s — falling through to ZeroBounce", domain)

    # ── Step 6: ZeroBounce ───────────────────────────────────────────────────
    zb_key = os.getenv("ZEROBOUNCE_API_KEY", "").strip()
    if not zb_key:
        logger.warning("ZEROBOUNCE_API_KEY not set — rejecting unknown email")
        return {"valid": False, "reason": "email_unverifiable"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.zerobounce.net/v2/validate",
                params={"api_key": zb_key, "email": email, "ip_address": ""},
            )
            zb = resp.json()

        zb_status = (zb.get("status") or "unknown").lower()
        sub_status = (zb.get("sub_status") or "").lower()
        is_free = zb.get("free_email") is True

        incorpid = f"{email} | {zb_status}"

        is_valid = (
            (zb_status in ("valid", "catch-all") or sub_status == "role_based")
            and not is_free
        )

        if is_valid:
            return {"valid": True}

        reason = "free_email" if is_free else f"zerobounce_{zb_status}"
        return {"valid": False, "reason": reason, "incorpid": incorpid}

    except Exception:
        logger.exception("ZeroBounce API error for %s", email)
        return {"valid": False, "reason": "email_unverifiable"}
