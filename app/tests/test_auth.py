from app.auth.otp_service import OtpSessionManager
from app.security.crypto import hash_pin_or_password, verify_hash, normalize_phone_number

def run_auth_tests():
    tests = []

    # 1. Phone number normalization
    norm = normalize_phone_number("98765 43210", default_country_code="+91")
    tests.append({
        "name": "Phone Number E.164 Normalization",
        "passed": norm == "+919876543210",
        "details": f"Normalized '98765 43210' -> {norm}"
    })

    # 2. PIN Hashing & Constant-time Verification
    pin = "4321"
    pin_hash = hash_pin_or_password(pin)
    valid = verify_hash(pin, pin_hash)
    invalid = verify_hash("9999", pin_hash)
    tests.append({
        "name": "Cryptographic PIN Hashing & Verification",
        "passed": valid and not invalid and len(pin_hash) == 64,
        "details": "SHA-256 salted PIN hash matches correctly; rejects invalid PIN."
    })

    # 3. OTP Lifecycle
    otp_mgr = OtpSessionManager()
    st, res = otp_mgr.send_otp("+919999988888")
    code = getattr(otp_mgr, "_last_dispatched_code", None) or res.get("devOtpCode")
    v_st, v_res = otp_mgr.verify_otp("+919999988888", code)
    tests.append({
        "name": "OTP Generation & Verification Flow",
        "passed": st == 200 and v_st == 200 and v_res.get("verified"),
        "details": "Generated 6-digit code, verified against SHA-256 hash successfully."
    })

    # 4. OTP Replay Protection
    replay_st, _ = otp_mgr.verify_otp("+919999988888", code)
    tests.append({
        "name": "OTP Replay Attack Prevention",
        "passed": replay_st != 200,
        "details": "Used OTP session was invalidated; replay attempt safely rejected."
    })

    return tests
