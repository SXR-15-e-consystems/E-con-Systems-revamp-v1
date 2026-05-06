import asyncio
from datetime import datetime, timezone
from typing import Any

from app.database import get_db
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def log_event(
    event_type: str,
    user_id: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Write an audit log entry. Non-blocking — failures are logged but never raised."""
    try:
        db = get_db()
        doc = {
            "event_type": event_type,
            "user_id": user_id,
            "target_id": target_id,
            "details": details or {},
            "ip_address": ip_address,
            "timestamp": datetime.now(timezone.utc),
        }
        await db.audit_log.insert_one(doc)
    except Exception:
        logger.exception("Failed to write audit log event: %s", event_type)


def fire_audit_event(
    event_type: str,
    user_id: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Fire-and-forget audit log write. Safe to call from sync context within an async loop."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            log_event(event_type, user_id, target_id, details, ip_address)
        )
    except RuntimeError:
        # No running loop (e.g., during startup or sync tests) — attempt synchronous write
        logger.error(
            "No running event loop when firing audit event '%s' — attempting sync fallback",
            event_type,
        )
        try:
            import asyncio as _asyncio
            _asyncio.run(log_event(event_type, user_id, target_id, details, ip_address))
        except Exception:
            logger.exception("Audit event '%s' permanently dropped — fallback write failed", event_type)
