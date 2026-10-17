from pydantic import BaseModel, ConfigDict, Field, field_validator


def validate_image_url(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if not (value.startswith("/") or value.startswith("https://") or value.startswith("http://")):
        raise ValueError("Image URLs must be site-relative or start with http:// or https://.")
    return value


class BoardMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    position: str
    image_url: str | None
    image_alt: str | None


class BoardMemberList(BaseModel):
    items: list[BoardMemberPublic]
    total: int


class BoardMemberWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(min_length=2, max_length=160)
    position: str = Field(min_length=2, max_length=160)
    image_url: str | None = Field(default=None, max_length=500)
    image_alt: str | None = Field(default=None, max_length=300)
    sort_order: int = Field(default=0, ge=0, le=10_000)
    is_published: bool = False

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        return validate_image_url(value)


class BoardMemberAdmin(BoardMemberPublic):
    sort_order: int
    is_published: bool


class BoardMemberAdminList(BaseModel):
    items: list[BoardMemberAdmin]
    total: int
