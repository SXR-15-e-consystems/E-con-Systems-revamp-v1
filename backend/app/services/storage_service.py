"""S3 file storage service — handles uploads for CMS documents."""

import os
import uuid
from typing import Any

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
# Read env vars at call time so hot-reload picks up .env changes.


def _s3_bucket() -> str:
    return os.getenv("S3_BUCKET", "")


def _s3_region() -> str:
    return os.getenv("S3_REGION", "us-east-1")


def _s3_prefix() -> str:
    return os.getenv("S3_UPLOAD_PREFIX", "uploads/documents")


def _cdn_base_url() -> str:
    return os.getenv("CDN_BASE_URL", "")


# File constraints
ALLOWED_EXTENSIONS = {".pdf", ".zip", ".doc", ".docx", ".stp", ".step", ".igs", ".iges"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # for STP/STEP/IGS files
    "model/step",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _get_s3_client() -> Any:
    """Create a boto3 S3 client with explicit or default credentials."""
    aws_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    kwargs: dict[str, Any] = {
        "region_name": _s3_region(),
        "config": BotoConfig(
            signature_version="s3v4",
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    }
    if aws_key and aws_secret:
        kwargs["aws_access_key_id"] = aws_key
        kwargs["aws_secret_access_key"] = aws_secret

    return boto3.client("s3", **kwargs)


def _get_extension(filename: str) -> str:
    """Extract lowercase extension from filename."""
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        return ""
    return filename[dot_idx:].lower()


def validate_upload(
    filename: str,
    content_type: str,
    file_size: int,
) -> str | None:
    """Validate file before upload. Returns error message or None if valid."""
    ext = _get_extension(filename)
    if not ext:
        return "File must have an extension"

    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        return f"File type '{ext}' not allowed. Allowed: {allowed}"

    if file_size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        return f"File too large. Maximum size is {max_mb} MB"

    if file_size == 0:
        return "File is empty"

    return None


def upload_file_to_s3(
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
) -> str:
    """Upload file bytes to S3 and return the public URL.

    The S3 key is generated server-side to prevent path traversal.
    Returns the CDN URL if CDN_BASE_URL is set, otherwise the S3 URL.

    Raises:
        ValueError: if S3_BUCKET is not configured
        ClientError: if S3 upload fails
    """
    if not _s3_bucket():
        raise ValueError("S3_BUCKET environment variable is not configured")

    bucket = _s3_bucket()
    region = _s3_region()
    prefix = _s3_prefix()
    cdn = _cdn_base_url()

    ext = _get_extension(original_filename)
    safe_name = uuid.uuid4().hex
    s3_key = f"{prefix}/{safe_name}{ext}"

    s3 = _get_s3_client()
    s3.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
        ContentDisposition=f'attachment; filename="{original_filename}"',
    )

    logger.info("Uploaded file to S3: %s (%d bytes)", s3_key, len(file_bytes))

    if cdn:
        return f"{cdn.rstrip('/')}/{s3_key}"

    return f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
