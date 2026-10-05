import hashlib
import hmac
import re
import secrets
from typing import Optional
from app.config.settings import SECRET_KEY

def hash_pin_or_password(value: str, salt: Optional[str] = None) -> str:
    """Computes a cryptographically salted SHA-256 hash of a PIN or password."""
    if not salt:
        salt = SECRET_KEY[:16]
    return hashlib.sha256(f"{salt}:{value}".encode("utf-8")).hexdigest()

def verify_hash(value: str, expected_hash: str, salt: Optional[str] = None) -> bool:
    """Constant-time comparison to prevent timing attacks on hash verification."""
    computed = hash_pin_or_password(value, salt)
    # Also support legacy direct sha256 of plain value for backwards compatibility
    legacy_computed = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return hmac.compare_digest(computed, expected_hash) or hmac.compare_digest(legacy_computed, expected_hash)

def generate_secure_token(nbytes: int = 24) -> str:
    """Generates an unguessable URL-safe cryptographic token."""
    return secrets.token_urlsafe(nbytes)

def generate_session_token(user_id: str) -> str:
    """Generates an authenticated session token for a user."""
    rand = secrets.token_hex(16)
    return f"kawach-sess-{user_id}-{rand}"

def normalize_phone_number(raw_phone: str, default_country_code: str = "+91") -> str:
    """
    Normalizes a phone number to standard E.164 format.
    Removes hyphens, spaces, and brackets.
    """
    if not raw_phone:
        return ""
    cleaned = re.sub(r"[^\d+]", "", raw_phone.strip())
    if cleaned.startswith("+"):
        return cleaned
    if cleaned.startswith("0"):
        cleaned = cleaned[1:]
    if len(cleaned) == 10:
        return f"{default_country_code}{cleaned}"
    return f"+{cleaned}"

def sanitize_text(text: Optional[str], max_length: int = 500) -> str:
    """Sanitizes user input string, removes control characters and truncates."""
    if not text:
        return ""
    # Strip HTML tags & control characters
    clean = re.sub(r"<[^>]*?>", "", str(text))
    clean = "".join(ch for ch in clean if ch.isprintable() or ch in "\n\r\t")
    return clean.strip()[:max_length]
