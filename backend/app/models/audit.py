from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from app.models import PyObjectId


class AuditLog(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    event_type: str
    user_id: str | None = None
    target_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
