"""Pydantic models for download request and contact inquiry endpoints."""

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
    phone: str = ""
    howDidYouHear: str = ""
    newsletter: bool = True
    termsAccepted: bool = False
    productName: str = ""
    incorpid: str = ""
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

    @field_validator("phone", "howDidYouHear", "state", "productName", "incorpid")
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


class ValidateEmailRequest(BaseModel):
    """Request body for POST /api/v1/public/validate-email."""

    email: EmailStr


class ValidateEmailResponse(BaseModel):
    """Response body for validate-email."""

    valid: bool
    reason: str = ""
    incorpid: str = ""


class ContactInquiryRequest(BaseModel):
    """Request body for POST /api/v1/public/contact-inquiry."""

    name: str
    email: EmailStr
    company: str = ""
    phone: str = ""
    country: str = ""
    state: str = ""
    howDidYouHear: str = ""
    requirements: str = ""
    product: str = ""

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Name is required")
        if len(stripped) > 200:
            raise ValueError("Name too long")
        return stripped

    @field_validator("company", "phone", "country", "state", "howDidYouHear", "product")
    @classmethod
    def limit_optional_length(cls, v: str) -> str:
        if len(v) > 500:
            raise ValueError("Value too long")
        return v.strip()

    @field_validator("requirements")
    @classmethod
    def limit_requirements(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Requirements too long")
        return v.strip()


class ContactInquiryResponse(BaseModel):
    """Response body for contact inquiry."""

    status: str
    message: str = ""


class BlockedEmailRequest(BaseModel):
    """Request body for POST /api/v1/public/downloads/log-blocked."""

    name: str = ""
    company: str = ""
    email: str
    domain: str = ""
    status: str = ""
    country: str = ""
    state: str = ""
    phone: str = ""
    productName: str = ""

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        stripped = v.strip().lower()
        if not stripped or "@" not in stripped:
            raise ValueError("Valid email required")
        return stripped

    @field_validator("name", "company", "domain", "status", "country", "state", "phone", "productName")
    @classmethod
    def limit_length(cls, v: str) -> str:
        if len(v) > 500:
            raise ValueError("Value too long")
        return v.strip()

