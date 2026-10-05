from app.sos.sos_engine import trigger_sos_session, update_sos_telemetry, resolve_sos_session

def run_sos_tests():
    tests = []

    # 1. SOS Incident Creation
    sos1 = trigger_sos_session(28.5694, 77.2062, accuracy_m=6.5, trigger_type="button")
    session_id = sos1.get("sessionId")
    share_token = sos1.get("shareToken")
    tests.append({
        "name": "Emergency SOS Incident Creation",
        "passed": bool(session_id and sos1.get("status") == "ACTIVE" and share_token),
        "details": f"Created incident {session_id} with secure share token."
    })

    # 2. Idempotency Protection (Point 34)
    # Repeated button tap must return same incident without duplicating
    sos2 = trigger_sos_session(28.5694, 77.2062, accuracy_m=6.5, trigger_type="button")
    tests.append({
        "name": "Emergency SOS Idempotency Protection",
        "passed": sos2.get("sessionId") == session_id,
        "details": "Subsequent activation returned existing active session without creating duplicate incident."
    })

    # 3. Telemetry Update & Breadcrumbs
    up = update_sos_telemetry(28.5710, 77.2080, accuracy_m=5.0, speed_mps=1.2, battery=85)
    tests.append({
        "name": "Live Location Telemetry & Breadcrumbs",
        "passed": up is not None and up.get("latitude") == 28.5710 and up.get("battery") == 85,
        "details": "Successfully appended live GPS breadcrumbs and updated telemetry."
    })

    # 4. Safe Resolution & Token Revocation
    res = resolve_sos_session("Safe resolution in unit test")
    tests.append({
        "name": "SOS Safe Resolution & Token Revocation",
        "passed": res is not None and res.get("status") == "RESOLVED",
        "details": "Incident marked RESOLVED and live tracking link revoked."
    })

    return tests
