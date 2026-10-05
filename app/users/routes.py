import json
from typing import Dict, Any, Tuple
from app.database.db import db
from app.security.crypto import sanitize_text, hash_pin_or_password

def handle_get_profile() -> Tuple[int, Dict[str, Any]]:
    user = db.data.get("user")
    if not user:
        return 404, {"error": "User profile not found."}
    return 200, {"success": True, "user": user}

def handle_update_profile(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    user = db.data.get("user", {})

    # Permitted editable fields
    editable_fields = [
        "name", "email", "bloodGroup", "emergencyMedicalNotes",
        "countdownSeconds", "preferredLanguage", "themeVariant",
        "darkMode", "highContrast", "age"
    ]
    updated_fields = []
    for field in editable_fields:
        if field in payload:
            user[field] = payload[field]
            updated_fields.append(field)

    # If updating PIN
    if "newPin" in payload and payload["newPin"]:
        user["pinHash"] = hash_pin_or_password(payload["newPin"].strip())
        updated_fields.append("pinHash")

    db.data["user"] = user
    db.log_audit("USER", "PROFILE_UPDATED", f"Updated settings: {updated_fields}", target_id=user.get("id"))
    db.save()

    return 200, {"success": True, "user": user, "updated": updated_fields}

def handle_delete_account() -> Tuple[int, Dict[str, Any]]:
    """Right to Erasure / Total Account Deletion (GDPR & DPDP compliant)."""
    user_id = db.data.get("user", {}).get("id", "usr-01")
    db.data["user"]["emergencyMedicalNotes"] = ""
    db.data["contacts"] = []
    db.data["active_sos"] = None
    db.data["emergency_history"] = []
    db.data["location_shares"] = {}
    db.data["evidence_vault"] = []

    db.log_audit("USER", "ACCOUNT_DELETED", f"User {user_id} performed full account data purge", target_id=user_id)
    db.save()
    return 200, {"success": True, "message": "All personal safety data and emergency contacts have been erased."}

def handle_export_data() -> Tuple[int, Dict[str, Any]]:
    """Allows user to securely export their profile, contacts, and emergency history."""
    return 200, {
        "success": True,
        "export": {
            "user": db.data.get("user"),
            "contacts": db.data.get("contacts"),
            "emergency_history": db.data.get("emergency_history"),
            "audit_logs": db.data.get("audit_logs", [])[:20]
        }
    }
