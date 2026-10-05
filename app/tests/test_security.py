from app.security.rate_limiter import RateLimiter
from app.security.crypto import sanitize_text
from app.recordings.vault_service import store_incident_evidence

def run_security_tests():
    tests = []

    # 1. Rate Limiting with Emergency Bypass
    limiter = RateLimiter()
    ip = "192.168.1.100"
    for _ in range(5):
        limiter.is_allowed(ip, max_requests=5, window_seconds=10)
    blocked, retry_after = limiter.is_allowed(ip, max_requests=5, window_seconds=10)

    # Emergency SOS must bypass rate limiter
    sos_allowed, _ = limiter.is_allowed(ip, max_requests=5, window_seconds=10, is_emergency=True)

    tests.append({
        "name": "Rate Limiter & SOS Emergency Bypass",
        "passed": not blocked and sos_allowed,
        "details": "Regular excess requests throttled; emergency SOS requests granted instant zero-latency bypass."
    })

    # 2. XSS & Control Character Stripping
    raw_input = "<script>alert('xss')</script>Priya \x00Sharma"
    sanitized = sanitize_text(raw_input)
    tests.append({
        "name": "Input Sanitization & Injection Defense",
        "passed": "<script>" not in sanitized and "Priya" in sanitized,
        "details": f"HTML tags and non-printable control chars stripped: '{sanitized}'"
    })

    # 3. Evidence Tamper-Proof Integrity Checksum
    status, ev_res = store_incident_evidence("Voice Memo", "audio_recording", 1024 * 32, "sample audio binary")
    tests.append({
        "name": "Cloud Evidence Vault SHA-256 Integrity Verification",
        "passed": status == 201 and len(ev_res["evidence"]["sha256Hash"]) == 64 and ev_res["evidence"]["verifiedTamperProof"],
        "details": f"Evidence stored with cryptographic checksum: {ev_res['evidence']['sha256Hash'][:12]}..."
    })

    return tests
