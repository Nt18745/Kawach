import json
from typing import Dict, Any, Tuple
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

from app.security.rate_limiter import rate_limiter
from app.monitoring.health import check_system_health, get_audit_logs
from app.auth.routes import handle_send_otp, handle_verify_otp, handle_login, handle_verify_pin
from app.users.routes import handle_get_profile, handle_update_profile, handle_delete_account, handle_export_data
from app.contacts.routes import handle_get_contacts, handle_add_contact, handle_update_contact, handle_delete_contact, handle_test_alert
from app.sos.routes import handle_sos_trigger, handle_sos_update_location, handle_sos_resolve, handle_sos_status, handle_sos_history
from app.location.routes import handle_get_nearby_facilities, handle_get_shared_location
from app.recordings.routes import handle_upload_evidence, handle_get_storage_metrics, handle_get_evidence_list
from app.emergency_services.routes import handle_get_emergency_numbers, handle_add_emergency_number

class ApiRouter:
    """Dispatches HTTP requests to appropriate modular domain controller."""

    def route_request(self, method: str, raw_url: str, body_bytes: bytes, client_ip: str) -> Tuple[int, Dict[str, Any]]:
        parsed = urlparse(raw_url)
        path = parsed.path.rstrip("/")
        if not path:
            path = "/"

        # Parse query params
        qs_raw = parse_qs(parsed.query)
        params = {k: v[0] if len(v) == 1 else v for k, v in qs_raw.items()}

        # Parse JSON body if present
        payload: Dict[str, Any] = {}
        if body_bytes:
            try:
                payload = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                return 400, {"error": "Invalid JSON request payload."}

        # Check Rate Limiting (Emergency SOS routes have immediate bypass)
        is_emergency = path.endswith("/sos/trigger") or path.endswith("/sos/update-location")
        allowed, retry_after = rate_limiter.is_allowed(client_ip, max_requests=120, window_seconds=60, is_emergency=is_emergency)
        if not allowed:
            return 429, {
                "error": f"Rate limit exceeded. Please wait {retry_after} seconds before retrying.",
                "retryAfter": retry_after
            }

        # Normalize path prefixes: allow both /api/v1/ and /api/
        p = path.replace("/api/v1/", "/api/").replace("/api/py/", "/api/")

        # 1. Health & Monitoring
        if method == "GET" and p in ("/api/health", "/"):
            return check_system_health()

        if method == "GET" and p == "/api/admin/audit-logs":
            return get_audit_logs()

        # 2. Authentication & Security
        if method == "POST" and p == "/api/auth/send-otp":
            return handle_send_otp(payload)

        if method == "POST" and p == "/api/auth/verify-otp":
            return handle_verify_otp(payload)

        if method == "POST" and p == "/api/auth/login":
            return handle_login(payload)

        if method == "POST" and p == "/api/auth/verify-pin":
            return handle_verify_pin(payload)

        # 3. User Profile
        if method == "GET" and p == "/api/profile":
            return handle_get_profile()

        if method in ("PUT", "POST") and p == "/api/profile":
            return handle_update_profile(payload)

        if method == "DELETE" and p == "/api/auth/account":
            return handle_delete_account()

        if method == "GET" and p == "/api/users/export":
            return handle_export_data()

        # 4. Trusted Contacts
        if method == "GET" and p == "/api/contacts":
            return handle_get_contacts()

        if method == "POST" and p == "/api/contacts":
            return handle_add_contact(payload)

        if method == "PUT" and p.startswith("/api/contacts/"):
            contact_id = p.split("/")[-1]
            return handle_update_contact(contact_id, payload)

        if method == "DELETE" and p.startswith("/api/contacts/"):
            contact_id = p.split("/")[-1]
            return handle_delete_contact(contact_id)

        if method == "POST" and "/test-alert" in p:
            parts = p.split("/")
            contact_id = parts[parts.index("contacts") + 1]
            return handle_test_alert(contact_id)

        # 5. Mission-Critical SOS Engine
        if method == "POST" and p == "/api/sos/trigger":
            return handle_sos_trigger(payload)

        if method == "POST" and p == "/api/sos/update-location":
            return handle_sos_update_location(payload)

        if method == "POST" and p in ("/api/sos/resolve", "/api/sos/cancel"):
            return handle_sos_resolve(payload)

        if method == "GET" and p == "/api/sos/status":
            return handle_sos_status()

        if method == "GET" and p == "/api/emergency-history":
            return handle_sos_history()

        # 6. Geolocation & Facilities
        if method == "GET" and p == "/api/facilities/nearby":
            return handle_get_nearby_facilities(params)

        if method == "GET" and p.startswith("/api/share/"):
            token = p.split("/")[-1]
            return handle_get_shared_location(token)

        # 7. Emergency Evidence & 1 TB Cloud Vault
        if method == "POST" and p == "/api/evidence/upload":
            return handle_upload_evidence(payload)

        if method == "GET" and p in ("/api/storage/metrics", "/api/storage/stats"):
            return handle_get_storage_metrics()

        if method == "GET" and p == "/api/evidence":
            return handle_get_evidence_list()

        # 8. Verified Emergency Directory
        if method == "GET" and p == "/api/emergency-numbers":
            return handle_get_emergency_numbers(params)

        if method == "POST" and p == "/api/admin/emergency-numbers":
            return handle_add_emergency_number(payload)

        # 9. Test Suite Execution
        if method in ("GET", "POST") and p in ("/api/test-suite/py", "/api/test-suite/run"):
            from app.tests.runner import run_all_tests
            return 200, run_all_tests()

        return 404, {"error": f"Endpoint not found: {method} {raw_url}"}

router = ApiRouter()
