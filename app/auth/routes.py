from typing import Dict, Any, Tuple
from app.database.db import db
from app.security.crypto import (
    normalize_phone_number,
    verify_hash,
    hash_pin_or_password,
    generate_session_token
)
from app.auth.otp_service import otp_manager

def handle_send_otp(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    phone = payload.get("phone", "")
    custom_config = {
        "fast2smsApiKey": payload.get("fast2smsApiKey"),
        "twilioAccountSid": payload.get("twilioAccountSid"),
        "twilioAuthToken": payload.get("twilioAuthToken") or payload.get("twilioApiKey"),
        "twilioPhoneNumber": payload.get("twilioPhoneNumber"),
        "smsProvider": payload.get("smsProvider")
    }
    return otp_manager.send_otp(phone, custom_config=custom_config)

def handle_verify_otp(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    phone = payload.get("phone", "")
    code = payload.get("code") or payload.get("otp", "")
    status_code, res = otp_manager.verify_otp(phone, str(code))

    if status_code == 200:
        clean_phone = normalize_phone_number(phone)
        user = db.data.get("user", {})
        # If user phone doesn't match or is new, ensure user phone is set
        if user:
            user["phone_verified"] = True
            db.save()
        token = generate_session_token(user.get("id", "usr-01"))
        return 200, {
            "success": True,
            "message": "Phone number successfully verified.",
            "token": token,
            "user": user
        }
    return status_code, res

def handle_login(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    phone_or_email = payload.get("phoneOrEmail", "").strip()
    pin = payload.get("pin", "").strip()

    user = db.data.get("user")
    if not user:
        return 404, {"error": "User account not found."}

    user_phone = normalize_phone_number(user.get("phone", ""))
    norm_input = normalize_phone_number(phone_or_email)

    matches = (
        (user.get("email") and user["email"].lower() == phone_or_email.lower()) or
        (norm_input and norm_input == user_phone)
    )

    if not matches:
        return 404, {"error": "Account not found for provided phone number or email."}

    # Verify PIN if configured
    stored_pin_hash = user.get("pinHash")
    if stored_pin_hash and pin:
        if not verify_hash(pin, stored_pin_hash):
            return 401, {"error": "Incorrect security PIN. Please try again."}

    token = generate_session_token(user["id"])
    db.log_audit("USER", "LOGIN_SUCCESS", f"User {user['name']} logged in successfully", target_id=user["id"])

    return 200, {
        "success": True,
        "token": token,
        "user": user
    }

def handle_verify_pin(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    pin = payload.get("pin", "").strip()
    user = db.data.get("user", {})
    stored_hash = user.get("pinHash", "")

    if not stored_hash:
        return 200, {"success": True, "valid": True}

    if not pin or not verify_hash(pin, stored_hash):
        return 401, {"error": "Incorrect security PIN."}

    return 200, {"success": True, "valid": True}
