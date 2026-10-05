import secrets
from typing import Dict, Any, Tuple
from app.database.db import db
from app.security.crypto import normalize_phone_number, sanitize_text
from app.notifications.channels import send_sms_via_provider

def handle_get_contacts() -> Tuple[int, Dict[str, Any]]:
    contacts = sorted(db.data.get("contacts", []), key=lambda c: c.get("priority", 99))
    return 200, {
        "success": True,
        "count": len(contacts),
        "contacts": contacts
    }

def handle_add_contact(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    name = sanitize_text(payload.get("name", ""))
    raw_phone = payload.get("phone", "")
    relationship = sanitize_text(payload.get("relationship", "Family"))
    priority = int(payload.get("priority", 1))

    if not name or not raw_phone:
        return 400, {"error": "Contact name and valid phone number are required."}

    clean_phone = normalize_phone_number(raw_phone)
    contact_id = f"cnt-{secrets.token_hex(4)}"

    new_contact = {
        "id": contact_id,
        "userId": db.data.get("user", {}).get("id", "usr-01"),
        "name": name,
        "phone": clean_phone,
        "relationship": relationship,
        "isEmergencyContact": True,
        "priority": priority,
        "alertsEnabled": True,
        "verificationStatus": "verified"
    }

    if "contacts" not in db.data:
        db.data["contacts"] = []
    db.data["contacts"].append(new_contact)
    db.log_audit("USER", "CONTACT_ADDED", f"Added trusted contact: {name} ({clean_phone})", target_id=contact_id)
    db.save()

    return 201, {"success": True, "contact": new_contact}

def handle_update_contact(contact_id: str, payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    contacts = db.data.get("contacts", [])
    matched = next((c for c in contacts if c.get("id") == contact_id), None)
    if not matched:
        return 404, {"error": "Trusted contact not found."}

    if "name" in payload:
        matched["name"] = sanitize_text(payload["name"])
    if "phone" in payload:
        matched["phone"] = normalize_phone_number(payload["phone"])
    if "relationship" in payload:
        matched["relationship"] = sanitize_text(payload["relationship"])
    if "priority" in payload:
        matched["priority"] = int(payload["priority"])
    if "alertsEnabled" in payload:
        matched["alertsEnabled"] = bool(payload["alertsEnabled"])

    db.log_audit("USER", "CONTACT_UPDATED", f"Updated contact: {matched['name']}", target_id=contact_id)
    db.save()
    return 200, {"success": True, "contact": matched}

def handle_delete_contact(contact_id: str) -> Tuple[int, Dict[str, Any]]:
    contacts = db.data.get("contacts", [])
    before_len = len(contacts)
    db.data["contacts"] = [c for c in contacts if c.get("id") != contact_id]

    if len(db.data["contacts"]) == before_len:
        return 404, {"error": "Contact not found."}

    db.log_audit("USER", "CONTACT_DELETED", f"Deleted contact {contact_id}", target_id=contact_id)
    db.save()
    return 200, {"success": True, "message": "Contact deleted successfully."}

def handle_test_alert(contact_id: str) -> Tuple[int, Dict[str, Any]]:
    """Sends a clearly labeled verification test alert that NEVER triggers real emergency services."""
    contacts = db.data.get("contacts", [])
    contact = next((c for c in contacts if c.get("id") == contact_id), None)
    if not contact:
        return 404, {"error": "Contact not found."}

    user_name = db.data.get("user", {}).get("name", "User")
    test_msg = f"[TEST ALERT - NOT AN EMERGENCY] Hello {contact['name']}, {user_name} tested their Kawach Emergency Network. Your number is configured properly."

    res = send_sms_via_provider(contact["phone"], contact["name"], test_msg)
    db.log_audit("USER", "TEST_ALERT_SENT", f"Sent test alert to {contact['name']} ({contact['phone']})", target_id=contact_id)
    return 200, {
        "success": True,
        "message": f"Test alert sent to {contact['name']}",
        "delivery": res
    }
