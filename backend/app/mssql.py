"""MS SQL connectivity for the econ/econshopping databases.

pyodbc is synchronous, so every blocking call is dispatched to the default
ThreadPoolExecutor via asyncio.get_event_loop().run_in_executor so it never
blocks the asyncio event loop.

Requires: ODBC Driver 17 for SQL Server (or 18) installed on the host.
"""
import asyncio
import functools
import os
import re
from typing import Any, Optional

import pypyodbc as pyodbc

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Module-level connection-strings built once at startup
_conn_str: Optional[str] = None
_shopping_conn_str: Optional[str] = None


def init_mssql() -> None:
    """Build and store the connection string. Called once from app lifespan."""
    global _conn_str, _shopping_conn_str
    host = os.getenv("MSSQL_HOST", "").strip()
    db = os.getenv("MSSQL_ECON_DB", "econ").strip()
    shopping_db = os.getenv("MSSQL_SHOPPING_DB", "econshopping").strip()
    user = os.getenv("MSSQL_USER", "").strip()
    password = os.getenv("MSSQL_PASSWORD", "").strip()

    if not host or not user or not password:
        logger.warning(
            "MSSQL_HOST / MSSQL_USER / MSSQL_PASSWORD env vars not set — "
            "live pricing will be unavailable."
        )
        _conn_str = None
        _shopping_conn_str = None
        return

    _conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={host};"
        f"DATABASE={db};"
        f"UID={user};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
        "Connection Timeout=10;"
    )
    _shopping_conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={host};"
        f"DATABASE={shopping_db};"
        f"UID={user};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
        "Connection Timeout=10;"
    )
    logger.info("MS SQL connection string configured (host=%s db=%s)", host, db)


def _sync_call_get_product_details(product_ids: str) -> Optional[str]:
    """Blocking pyodbc call — always run inside run_in_executor, never directly."""
    if _conn_str is None:
        raise RuntimeError("MS SQL not configured — check MSSQL_* env vars")

    # Each request opens its own short-lived connection; no shared pool needed
    # because this is a read-only lookup called at most once per page render.
    conn = pyodbc.connect(_conn_str, timeout=10)
    try:
        cursor = conn.cursor()
        # Parameterised call — product_ids is passed as a single bound parameter,
        # never interpolated into the SQL string (prevents injection).
        cursor.execute(
            "EXEC cart.GetProductDetails @prodcutID = ?",
            product_ids,
        )
        row = cursor.fetchone()
        return str(row[0]) if row and row[0] is not None else None
    finally:
        conn.close()


async def call_get_product_details(product_ids: str) -> Optional[str]:
    """Async wrapper — dispatches the blocking call to a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        functools.partial(_sync_call_get_product_details, product_ids),
    )


# ── Download / lead-management SQL helpers ────────────────────────────────────

def _get_category(product_name: str) -> str:
    """Map product name to PSI category (mirrors GetCategory() in ASP)."""
    p = product_name.upper()
    if re.search(r"CUNX|CUXVR|CUOAGX|CUONX", p):
        return "NVIDIA"
    if re.search(r"MOD|NILECAM|NILE3CAM|STURDECAM|NEDUCAM", p):
        return "Camera Module"
    if re.search(r"SEE3CAM|FSCAM|TARA|USB", p):
        return "USB"
    return "Embedded Vision"


def _sync_check_domain(domain: str) -> str:
    """Check domain in InvalidDomain / ValidDomain tables.
    Returns '1' (blocked), '2' (valid), or '3' (unknown).
    """
    if _conn_str is None:
        return "3"
    conn = pyodbc.connect(_conn_str, timeout=10)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT TOP 1 1 FROM InvalidDomain WHERE InvalidDomainName = ? AND IsBlocked = '1'",
            domain,
        )
        if cursor.fetchone():
            return "1"
        cursor.execute(
            "SELECT TOP 1 1 FROM ValidDomain WHERE ValidDomainName = ?",
            domain,
        )
        if cursor.fetchone():
            return "2"
        return "3"
    finally:
        conn.close()


async def check_domain(domain: str) -> str:
    """Async: check domain status. Returns '1' blocked, '2' valid, '3' unknown."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(_sync_check_domain, domain))


def _sync_check_guest_email(email: str) -> bool:
    """Check if email exists as a guest customer in econshopping DB."""
    if _shopping_conn_str is None:
        return False
    try:
        conn = pyodbc.connect(_shopping_conn_str, timeout=10)
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT TOP 1 1 FROM Customer WHERE GuestEmail = ?",
                email,
            )
            return cursor.fetchone() is not None
        finally:
            conn.close()
    except Exception:
        logger.warning("econshopping DB unavailable — skipping guest email check")
        return False


async def check_guest_email(email: str) -> bool:
    """Async: check if email is an existing guest customer."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(_sync_check_guest_email, email))


def _sync_count_domain_users(domain: str) -> int:
    """Count registered AspNetUsers with the given email domain."""
    if _conn_str is None:
        return 0
    conn = pyodbc.connect(_conn_str, timeout=10)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(Email) AS cnt FROM AspNetUsers WHERE Email LIKE ?",
            f"%@{domain}",
        )
        row = cursor.fetchone()
        return int(row[0]) if row and row[0] is not None else 0
    finally:
        conn.close()


async def count_domain_users(domain: str) -> int:
    """Async: count AspNetUsers for a domain."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(_sync_count_domain_users, domain))


def _sync_add_lead_automation(params: dict[str, Any]) -> str:
    """Call usp_AddLeadAutomation and return the downloadId."""
    if _conn_str is None:
        return "0"
    conn = pyodbc.connect(_conn_str, timeout=15)
    try:
        cursor = conn.cursor()
        category = _get_category(params.get("product_name", ""))
        cursor.execute(
            """
            EXEC dbo.usp_AddLeadAutomation
                @email         = ?,
                @productName   = ?,
                @companyName   = ?,
                @lastName      = ?,
                @country       = ?,
                @state         = ?,
                @city          = ?,
                @contactNumber = ?,
                @sendnewsletter= ?,
                @leadsource    = ?,
                @clientid      = ?,
                @knowecon      = ?,
                @psicategory   = ?,
                @documentList  = ?,
                @description   = ?
            """,
            params.get("email", ""),
            params.get("product_name", ""),
            params.get("company", ""),
            params.get("name", ""),
            params.get("country", ""),
            params.get("state", ""),
            params.get("city", "N/A"),
            params.get("phone", ""),
            params.get("newsletter", 0),
            params.get("leadsource", "Web Download"),
            "",
            params.get("knowecon", ""),
            category,
            params.get("doclist", ""),
            None,
        )
        row = cursor.fetchone()
        conn.commit()
        if row and row[0] is not None:
            return str(row[0])
        return "0"
    except Exception:
        logger.exception("usp_AddLeadAutomation failed")
        return "0"
    finally:
        conn.close()


async def add_lead_automation(params: dict[str, Any]) -> str:
    """Async: call usp_AddLeadAutomation, returns downloadId string."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, functools.partial(_sync_add_lead_automation, params))


def _sync_add_blocked_user(params: dict[str, Any]) -> None:
    """Insert a record into BlockedEmailUserDetails."""
    if _conn_str is None:
        return
    conn = pyodbc.connect(_conn_str, timeout=10)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO BlockedEmailUserDetails
                (Name, Company, Email, Domain, Status, Country, State, City, Phone, PSI)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            params.get("name", ""),
            params.get("company", ""),
            params.get("email", ""),
            params.get("domain", ""),
            params.get("status", ""),
            params.get("country", ""),
            params.get("state", ""),
            params.get("city", ""),
            params.get("phone", ""),
            params.get("psi", ""),
        )
        conn.commit()
    except Exception:
        logger.exception("BlockedEmailUserDetails insert failed")
    finally:
        conn.close()


async def add_blocked_user(params: dict[str, Any]) -> None:
    """Async: record a blocked / invalid email attempt."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, functools.partial(_sync_add_blocked_user, params))
