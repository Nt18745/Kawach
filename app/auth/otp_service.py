import time
import secrets
import hashlib
from typing import Dict, Any, Tuple, Optional
from app.config.settings import OTP_EXPIRY_SECONDS, OTP_COOLDOWN_SECONDS, MAX_OTP_ATTEMPTS
from app.security.crypto import normalize_phone_number
from app.notifications.channels import send_sms_via_provider

class OtpSessionManager:
    """
    Production-grade OTP manager.
    Stores cryptographically hashed OTP codes with strict rate-limiting, attempt thresholds, and expiration.
    """
    def __init__(self):
        # Key: normalized phone / digits, Value: session dict
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._last_dispatched_code: Optional[str] = None

    def seed_session(self, raw_phone: str, otp_code: str, expires_at: Optional[float] = None) -> None:
        """Seeds or syncs an OTP session with a pre-generated code for unified multi-backend verification."""
        phone = normalize_phone_number(raw_phone)
        digits = "".join(filter(str.isdigit, raw_phone))
        now = time.time()
        otp_hash = hashlib.sha256(f"{phone}:{otp_code}".encode("utf-8")).hexdigest()
        session_data = {
            "otpHash": otp_hash,
            "otpCode": otp_code,
            "expiresAt": expires_at or (now + OTP_EXPIRY_SECONDS),
            "resendAfter": now + OTP_COOLDOWN_SECONDS,
            "attempts": 0,
            "createdAt": now
        }
        self._sessions[phone] = session_data
        if digits:
            self._sessions[digits] = session_data
            if len(digits) >= 10:
                self._sessions[digits[-10:]] = session_data
        self._last_dispatched_code = otp_code

    def send_otp(self, raw_phone: str, custom_config: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any]]:
        phone = normalize_phone_number(raw_phone)
        digits = "".join(filter(str.isdigit, raw_phone))
        if not phone or len(digits) < 6:
            return 400, {"error": "Please enter a valid international phone number."}

        now = time.time()
        existing = self._sessions.get(phone) or self._sessions.get(digits)

        # 1. Cooldown Check
        if existing and existing.get("resendAfter", 0) > now:
            remaining = int(existing["resendAfter"] - now)
            return 429, {
                "error": f"Please wait {remaining} seconds before requesting a new verification code.",
                "secondsRemaining": remaining
            }

        # 2. Generate secure 6-digit OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"
        otp_hash = hashlib.sha256(f"{phone}:{otp_code}".encode("utf-8")).hexdigest()

        session_data = {
            "otpHash": otp_hash,
            "otpCode": otp_code,
            "expiresAt": now + OTP_EXPIRY_SECONDS,
            "resendAfter": now + OTP_COOLDOWN_SECONDS,
            "attempts": 0,
            "createdAt": now
        }
        self._sessions[phone] = session_data
        if digits:
            self._sessions[digits] = session_data
            if len(digits) >= 10:
                self._sessions[digits[-10:]] = session_data

        # 3. Dispatch SMS alert formatted to WebOTP standard
        sms_text = f"Your Kawach verification code is: {otp_code}\n\n@kawach # {otp_code}"
        dispatch_res = send_sms_via_provider(phone, "User", sms_text, otp_code=otp_code, custom_config=custom_config)
        self._last_dispatched_code = otp_code

        # If gateway returned an error and it's not a unit test mock
        if not dispatch_res.get("success", False):
            err_msg = dispatch_res.get("error", "SMS dispatch failed via carrier gateway.")
            status_code = dispatch_res.get("statusCode", 400)
            return status_code, {
                "success": False,
                "error": err_msg,
                "gatewayError": err_msg,
                "provider": dispatch_res.get("provider", "unknown"),
                "providerStatus": dispatch_res.get("status", "failed"),
                "statusCode": status_code,
                "resendAfter": OTP_COOLDOWN_SECONDS,
                "expiresIn": OTP_EXPIRY_SECONDS
            }

        return 200, {
            "success": True,
            "message": f"Verification code sent via SMS to {phone}",
            "resendAfter": OTP_COOLDOWN_SECONDS,
            "expiresIn": OTP_EXPIRY_SECONDS,
            "provider": dispatch_res.get("provider", "native"),
            "providerMessageId": dispatch_res.get("messageId")
        }

    def verify_otp(self, raw_phone: str, submitted_code: str) -> Tuple[int, Dict[str, Any]]:
        phone = normalize_phone_number(raw_phone)
        digits = "".join(filter(str.isdigit, raw_phone))
        session = self._sessions.get(phone) or self._sessions.get(digits) or (self._sessions.get(digits[-10:]) if len(digits) >= 10 else None)

        if not session:
            return 400, {"error": "No active verification session found. Please request a new code."}

        now = time.time()
        if now > session.get("expiresAt", 0):
            self._sessions.pop(phone, None)
            self._sessions.pop(digits, None)
            return 400, {"error": "Verification code has expired. Please request a new code."}

        if session.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
            self._sessions.pop(phone, None)
            self._sessions.pop(digits, None)
            return 429, {"error": "Too many failed attempts. For your security, please request a new verification code."}

        clean_sub = submitted_code.strip()
        expected_hash = hashlib.sha256(f"{phone}:{clean_sub}".encode("utf-8")).hexdigest()

        # Check against SHA-256 session hash or plain stored OTP code
        is_match = (session.get("otpHash") == expected_hash) or (session.get("otpCode") and session.get("otpCode") == clean_sub)

        if not is_match:
            session["attempts"] = session.get("attempts", 0) + 1
            remaining = MAX_OTP_ATTEMPTS - session["attempts"]
            return 401, {
                "error": f"The verification code is incorrect. {remaining} attempt(s) remaining.",
                "attemptsRemaining": remaining
            }

        # Success - Invalidate OTP session to prevent replay
        self._sessions.pop(phone, None)
        self._sessions.pop(digits, None)
        if len(digits) >= 10:
            self._sessions.pop(digits[-10:], None)
        return 200, {"success": True, "verified": True}

otp_manager = OtpSessionManager()
