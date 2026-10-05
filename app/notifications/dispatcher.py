import time
from typing import List, Dict, Any
from app.notifications.channels import send_sms_via_provider
from app.database.db import db

def dispatch_emergency_notifications(
    user_name: str,
    contacts: List[Dict[str, Any]],
    incident_id: str,
    share_token: str,
    lat: float,
    lon: float,
    battery: int = None
) -> List[Dict[str, Any]]:
    """
    Dispatches emergency notifications to verified trusted contacts.
    Maintains delivery receipt and status for every contact.
    """
    map_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
    live_link = f"/live/{share_token}" if share_token else map_link

    # Formulate concise emergency message (SMS compliant)
    batt_str = f" | Batt: {battery}%" if battery is not None else ""
    sms_body = (
        f"EMERGENCY ALERT: {user_name} activated SOS! "
        f"Location: {map_link} | Live: https://kawach.org{live_link}{batt_str} | ID: {incident_id}"
    )

    results = []
    for c in contacts:
        if not c.get("alertsEnabled", True):
            continue

        contact_id = c.get("id")
        phone = c.get("phone")
        name = c.get("name")

        # Retry logic with exponential backoff (up to 2 attempts)
        delivery_res = None
        for attempt in range(1, 3):
            delivery_res = send_sms_via_provider(phone, name, sms_body)
            if delivery_res.get("success"):
                break
            time.sleep(0.5 * attempt)

        status = "DELIVERED" if delivery_res.get("success") else "FAILED"

        receipt = {
            "contactId": contact_id,
            "name": name,
            "phone": phone,
            "channel": "SMS",
            "provider": delivery_res.get("provider", "native"),
            "status": status,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "message": sms_body
        }
        results.append(receipt)

    db.log_audit("SYSTEM", "NOTIFICATIONS_DISPATCHED", f"Dispatched SOS alerts to {len(results)} contacts for {incident_id}")
    return results
