"""Pydantic models for download request endpoint."""

from pydantic import BaseModel, EmailStr, field_validator


class DownloadDocumentItem(BaseModel):
    """A single document in the download request."""

    name: str
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped.startswith(("http://", "https://")):
            raise ValueError("Only http(s) URLs are allowed")
        return stripped

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Document name cannot be empty")
        if len(stripped) > 500:
            raise ValueError("Document name too long")
        return stripped


class DownloadRequest(BaseModel):
    """Request body for POST /api/v1/public/downloads/request."""

    name: str
    email: EmailStr
    company: str
    country: str
    state: str = ""
    requirements: str = ""
    howDidYouHear: str = ""
    recaptchaToken: str = ""
    documents: list[DownloadDocumentItem]

    @field_validator("name", "company", "country")
    @classmethod
    def not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("This field is required")
        if len(stripped) > 500:
            raise ValueError("Value too long")
        return stripped

    @field_validator("requirements", "howDidYouHear", "state")
    @classmethod
    def limit_length(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Value too long")
        return v.strip()

    @field_validator("documents")
    @classmethod
    def at_least_one_document(cls, v: list[DownloadDocumentItem]) -> list[DownloadDocumentItem]:
        if not v:
            raise ValueError("At least one document is required")
        if len(v) > 50:
            raise ValueError("Too many documents")
        return v


class DownloadResponse(BaseModel):
    """Response body for download request endpoint."""

    status: str
    message: str = ""
