import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DB_FILE = os.getenv("HER_SAFE_DB_PATH", str(BASE_DIR / "her_safe_db.json"))
SERVER_PORT = int(os.getenv("PYTHON_PORT", "8001"))
SERVER_HOST = os.getenv("PYTHON_HOST", "0.0.0.0")

# Security & Secrets
SECRET_KEY = os.getenv("APP_SECRET_KEY", "kawach-guardian-production-secret-2026")
TOKEN_EXPIRY_HOURS = int(os.getenv("TOKEN_EXPIRY_HOURS", "24"))
EMERGENCY_LINK_EXPIRY_HOURS = int(os.getenv("EMERGENCY_LINK_EXPIRY_HOURS", "2"))
OTP_EXPIRY_SECONDS = int(os.getenv("OTP_EXPIRY_SECONDS", "300"))
OTP_COOLDOWN_SECONDS = int(os.getenv("OTP_COOLDOWN_SECONDS", "15"))
MAX_OTP_ATTEMPTS = int(os.getenv("MAX_OTP_ATTEMPTS", "3"))

# Storage Configuration (1 TB default allocated quota)
TOTAL_STORAGE_QUOTA_BYTES = 1000 * 1024 * 1024 * 1024  # 1 TB
MAX_EVIDENCE_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EVIDENCE_TYPES = ["audio/wav", "audio/webm", "audio/ogg", "audio/mp4", "image/jpeg", "image/png", "application/json"]

# SMS & External Integrations
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console_fallback")  # twilio, fast2sms, aws_sns, console_fallback
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")

# Rate Limits (requests per window)
RATE_LIMIT_AUTH = int(os.getenv("RATE_LIMIT_AUTH", "10"))  # per minute
RATE_LIMIT_API = int(os.getenv("RATE_LIMIT_API", "60"))    # per minute
# Note: SOS endpoints are exempted from throttling to ensure absolute availability
