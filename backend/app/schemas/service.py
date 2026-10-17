from pydantic import BaseModel, ConfigDict, Field

from app.schemas.project import SLUG_PATTERN


class ServicePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    number: str
    title: str
    category: str
    capacity: str | None
    summary: str
    description: str


class ServiceList(BaseModel):
    items: list[ServicePublic]
    total: int
    limit: int
    offset: int


class ServiceWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    slug: str = Field(min_length=3, max_length=120, pattern=SLUG_PATTERN)
    number: str = Field(min_length=1, max_length=8)
    title: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=2, max_length=80)
    capacity: str | None = Field(default=None, max_length=100)
    summary: str = Field(min_length=10, max_length=500)
    description: str = Field(min_length=10, max_length=10_000)
    sort_order: int = Field(default=0, ge=0, le=10_000)
    is_published: bool = False


class ServiceAdmin(ServicePublic):
    id: int
    sort_order: int
    is_published: bool


class ServiceAdminList(BaseModel):
    items: list[ServiceAdmin]
    total: int
