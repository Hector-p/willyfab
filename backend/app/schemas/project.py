from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.board_member import validate_image_url

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class ProjectPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    number: str
    title: str
    category: str
    image_url: str | None
    image_alt: str | None
    short_description: str
    brief: str
    scope: str
    client: str | None
    location: str | None
    start_date: date | None
    completion_date: date | None
    featured: bool


class ProjectList(BaseModel):
    items: list[ProjectPublic]
    total: int
    limit: int
    offset: int


class ProjectWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    slug: str = Field(min_length=3, max_length=140, pattern=SLUG_PATTERN)
    number: str = Field(min_length=1, max_length=8)
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    image_alt: str | None = Field(default=None, max_length=300)
    short_description: str = Field(min_length=10, max_length=500)
    brief: str = Field(min_length=10, max_length=5000)
    scope: str = Field(min_length=10, max_length=5000)
    client: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    start_date: date | None = None
    completion_date: date | None = None
    featured: bool = False
    sort_order: int = Field(default=0, ge=0, le=10_000)
    is_published: bool = False

    @field_validator("image_url")
    @classmethod
    def check_image_url(cls, value: str | None) -> str | None:
        return validate_image_url(value)


class ProjectAdmin(ProjectPublic):
    id: int
    sort_order: int
    is_published: bool


class ProjectAdminList(BaseModel):
    items: list[ProjectAdmin]
    total: int
