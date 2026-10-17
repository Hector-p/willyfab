from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

from app.core.config import Settings


class StorageNotConfigured(RuntimeError):
    """Raised when the selected storage backend lacks required settings."""


class ObjectStorage(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> str:
        """Store the bytes under key and return the public URL of the object."""

    def delete(self, key: str) -> None:
        """Remove the object stored under key. Missing objects are not an error."""


class LocalStorage:
    def __init__(self, upload_dir: str, media_base_url: str) -> None:
        self._directory = Path(upload_dir)
        self._media_base_url = media_base_url.rstrip("/")

    def save(self, key: str, data: bytes, content_type: str) -> str:
        self._directory.mkdir(parents=True, exist_ok=True)
        (self._directory / key).write_bytes(data)
        return f"{self._media_base_url}/{key}"

    def delete(self, key: str) -> None:
        path = self._directory / key
        if path.parent.resolve() != self._directory.resolve():
            raise ValueError("Storage keys must be flat file names.")
        path.unlink(missing_ok=True)


class R2Storage:
    def __init__(self, client: Any, bucket: str, public_base_url: str) -> None:
        self._client = client
        self._bucket = bucket
        self._public_base_url = public_base_url.rstrip("/")

    def save(self, key: str, data: bytes, content_type: str) -> str:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
        return f"{self._public_base_url}/{key}"

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)


@lru_cache
def _r2_client(endpoint_url: str, access_key_id: str, secret_access_key: str) -> Any:
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )


def storage_key_for_url(url: str, settings: Settings) -> str | None:
    """Return the storage key for a URL served from our own media base, else None.

    Only URLs under the configured media base are considered, so cleanup never
    touches external images or the static images bundled with the frontend.
    """
    for base in (settings.media_base_url, settings.r2_public_base_url):
        if not base:
            continue
        prefix = base.rstrip("/") + "/"
        if url.startswith(prefix):
            key = url[len(prefix) :]
            if key and "/" not in key and "?" not in key:
                return key
    return None


def build_storage(settings: Settings) -> ObjectStorage:
    if settings.storage_backend == "local":
        return LocalStorage(settings.upload_dir, settings.media_base_url)

    endpoint = settings.r2_endpoint_url
    access_key_id = settings.r2_access_key_id
    secret_access_key = settings.r2_secret_access_key
    bucket = settings.r2_bucket
    public_base_url = settings.r2_public_base_url
    if not (endpoint and access_key_id and secret_access_key and bucket and public_base_url):
        raise StorageNotConfigured(
            "R2 storage needs R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, "
            "R2_BUCKET and R2_PUBLIC_BASE_URL"
        )
    client = _r2_client(endpoint, access_key_id, secret_access_key)
    return R2Storage(client, bucket, public_base_url)
