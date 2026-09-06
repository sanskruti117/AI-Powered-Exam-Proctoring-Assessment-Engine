import os
import time
import json
import hmac
import hashlib
import base64
from typing import Optional, Dict, Any
import bcrypt
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv(
    "JWT_SECRET", "exam_proctoring_super_secure_jwt_secret_key_32bytes_long"
)
AUTH_COOKIE_NAME = "proctor_auth_token"
REFRESH_COOKIE_NAME = "proctor_refresh_token"


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt (10 rounds).
    """
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def compare_password(password: str, hashed_password: str) -> bool:
    """
    Compare a plain text password with a stored bcrypt hash ($2a$ or $2b$).
    """
    try:
        return bcrypt.checkpw(
            password.encode("utf-8")[:72],
            hashed_password.encode("utf-8"),
        )
    except Exception as e:
        print(f"Password comparison error: {e}")
        return False


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + padding)


def sign_token(payload: Dict[str, Any], expires_in_seconds: int = 15 * 60) -> str:
    """
    Sign an Edge and Node compatible HS256 JSON Web Token.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    token_payload = {
        **payload,
        "iat": now,
        "exp": now + expires_in_seconds,
    }

    header_b64 = _base64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_b64 = _base64url_encode(
        json.dumps(token_payload, separators=(",", ":")).encode("utf-8")
    )

    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def sign_refresh_token(user_id: str, expires_in_seconds: int = 7 * 24 * 60 * 60) -> str:
    """
    Sign a Refresh Token.
    """
    return sign_token({"userId": user_id, "type": "refresh"}, expires_in_seconds=expires_in_seconds)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode an HS256 JWT token.
    """
    if not token or not isinstance(token, str):
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, sig_b64 = parts

    try:
        expected_sig = hmac.new(
            JWT_SECRET.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        provided_sig = _base64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))

        # Expiration check
        if "exp" in payload and payload["exp"] < time.time():
            return None

        return payload
    except Exception:
        return None
