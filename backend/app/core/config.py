from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    database_url: str = "postgresql+psycopg://portfolio:portfolio@localhost:5432/portfolio"

    # Administration. Admin routes stay disabled until both values are configured.
    admin_email: str | None = None
    admin_password_hash: str | None = None
    session_secret: str | None = None
    admin_token_ttl_minutes: int = 720

    # Uploaded media. "local" writes under upload_dir and serves from media_base_url.
    # "r2" uploads to a Cloudflare R2 bucket through its S3-compatible API.
    storage_backend: Literal["local", "r2"] = "local"
    upload_dir: str = "uploads"
    media_base_url: str = "http://127.0.0.1:8000/media"
    max_upload_bytes: int = 5 * 1024 * 1024
    r2_endpoint_url: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket: str | None = None
    r2_public_base_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> str | list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
