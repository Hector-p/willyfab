import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^\+?[0-9 ()\-]{7,20}$")


class InquiryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=254)
    phone: str | None = Field(default=None, max_length=32)
    company: str | None = Field(default=None, max_length=160)
    service_interest: str | None = Field(default=None, max_length=120)
    message: str = Field(min_length=10, max_length=3000)
    # Honeypot: real visitors leave this empty; bots that fill it are silently discarded.
    website: str | None = Field(default=None, max_length=200)

    @field_validator("phone", "company", "service_interest", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is not None and not PHONE_PATTERN.match(value):
            raise ValueError("Enter a valid phone number.")
        return value


class InquiryReceipt(BaseModel):
    status: str


InquiryStatus = Literal["new", "contacted", "archived"]


class InquiryStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: InquiryStatus


class InquiryAdmin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None
    company: str | None
    service_interest: str | None
    message: str
    status: InquiryStatus
    created_at: datetime


class InquiryAdminList(BaseModel):
    items: list[InquiryAdmin]
    total: int
    limit: int
    offset: int
