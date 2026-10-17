import uuid
from dataclasses import dataclass
from typing import BinaryIO

from app.core.storage import ObjectStorage

ALLOWED_IMAGE_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class UploadRejected(ValueError):
    """Raised when an uploaded file fails size or content checks."""


@dataclass(frozen=True)
class StoredFile:
    filename: str
    url: str


def detect_image_type(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return None


def store_image(stream: BinaryIO, storage: ObjectStorage, max_bytes: int) -> StoredFile:
    data = stream.read(max_bytes + 1)
    if not data:
        raise UploadRejected("The uploaded file is empty.")
    if len(data) > max_bytes:
        raise UploadRejected(f"Images must be {max_bytes // (1024 * 1024)} MB or smaller.")

    content_type = detect_image_type(data[:12])
    if content_type is None:
        raise UploadRejected("Upload a JPEG, PNG or WebP image.")

    filename = f"{uuid.uuid4().hex}{ALLOWED_IMAGE_TYPES[content_type]}"
    url = storage.save(filename, data, content_type)
    return StoredFile(filename=filename, url=url)
