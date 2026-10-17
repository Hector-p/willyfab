from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.board_member import validate_image_url


class GalleryImagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    image_url: str
    image_alt: str
    caption: str | None
    featured: bool


class GalleryImageList(BaseModel):
    items: list[GalleryImagePublic]
    total: int


class GalleryImageWrite(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=2, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    image_url: str = Field(min_length=1, max_length=500)
    image_alt: str = Field(min_length=3, max_length=300)
    caption: str | None = Field(default=None, max_length=500)
    featured: bool = False
    sort_order: int = Field(default=0, ge=0, le=10_000)
    is_published: bool = False

    @field_validator("image_url")
    @classmethod
    def check_image_url(cls, value: str) -> str:
        checked = validate_image_url(value)
        if checked is None:
            raise ValueError("An image is required.")
        return checked

    @field_validator("caption", mode="before")
    @classmethod
    def blank_caption_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value


class GalleryImageAdmin(GalleryImagePublic):
    sort_order: int
    is_published: bool


class GalleryImageAdminList(BaseModel):
    items: list[GalleryImageAdmin]
    total: int


class GalleryReorder(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ids: list[int] = Field(min_length=1, max_length=500)

    @field_validator("ids")
    @classmethod
    def ids_must_be_unique(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value):
            raise ValueError("Each gallery image may appear only once.")
        return value
