import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 32


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def hash_password(password: str) -> str:
    """Return a self-describing scrypt hash suitable for storing in configuration."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        scheme, n, r, p, salt_text, digest_text = stored_hash.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    candidate = hashlib.scrypt(
        password.encode("utf-8"),
        salt=_b64decode(salt_text),
        n=int(n),
        r=int(r),
        p=int(p),
        dklen=len(_b64decode(digest_text)),
    )
    return hmac.compare_digest(candidate, _b64decode(digest_text))


@dataclass(frozen=True)
class AdminToken:
    subject: str
    expires_at: int


def create_admin_token(subject: str, secret: str, ttl_minutes: int) -> tuple[AdminToken, str]:
    expires_at = int(time.time()) + ttl_minutes * 60
    body = _b64encode(
        json.dumps({"sub": subject, "exp": expires_at}, separators=(",", ":")).encode()
    )
    signature = _sign(body, secret)
    return AdminToken(subject=subject, expires_at=expires_at), f"{body}.{signature}"


def read_admin_token(token: str, secret: str) -> AdminToken | None:
    try:
        body, signature = token.split(".", 1)
    except ValueError:
        return None
    if not hmac.compare_digest(signature, _sign(body, secret)):
        return None
    try:
        payload = json.loads(_b64decode(body))
    except (ValueError, json.JSONDecodeError):
        return None
    expires_at = payload.get("exp")
    subject = payload.get("sub")
    if not isinstance(expires_at, int) or not isinstance(subject, str):
        return None
    if expires_at <= int(time.time()):
        return None
    return AdminToken(subject=subject, expires_at=expires_at)


def _sign(body: str, secret: str) -> str:
    return _b64encode(
        hmac.new(secret.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
    )
