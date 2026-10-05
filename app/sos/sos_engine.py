import time
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.database.db import db
from app.notifications.dispatcher import dispatch_emergency_notifications
from app.config.settings import EMERGENCY_LINK_EXPIRY_HOURS

def trigger_sos_session(
    lat: float,
    lon: float,
    accuracy_m: float = 8.0,
    speed_mps: Optional[float] = None,
    altitude_m: Optional[float] = None,
    battery: Optional[int] = None,
    network_type: str = "4G/5G",
    trigger_type: str = "button"
) -> Dict[str, Any]:
    """
    Activates an emergency SOS incident with idempotency protection.
    If an SOS session is already ACTIVE, safely returns the existing incident without duplicating.
    """
    # 1. Idempotency Check: Return existing active incident if present
    existing_sos = db.data.get("active_sos")
    if existing_sos and existing_sos.get("status") == "ACTIVE":
        # Update latest telemetry without recreating incident
        update_sos_telemetry(lat, lon, accuracy_m, speed_mps, altitude_m, battery, network_type)
        return db.data["active_sos"]

    now = datetime.utcnow()
    now_iso = now.isoformat() + "Z"
    incident_id = f"INC-{now.year}-{secrets.token_hex(4).upper()}"
    share_token = secrets.token_urlsafe(16)
    expires_at = (now + timedelta(hours=EMERGENCY_LINK_EXPIRY_HOURS)).isoformat() + "Z"

    # 2. Register temporary tracking token
    share_record = {
        "token": share_token,
        "sessionId": incident_id,
        "latitude": lat,
        "longitude": lon,
        "accuracyMeters": accuracy_m,
        "speed": speed_mps,
        "altitude": altitude_m,
        "battery": battery,
        "networkType": network_type,
        "createdAt": now_iso,
        "expiresAt": expires_at,
        "active": True,
        "accessCount": 0
    }
    if "location_shares" not in db.data:
        db.data["location_shares"] = {}
    db.data["location_shares"][share_token] = share_record

    # 3. Notify Trusted Contacts
    contacts = db.data.get("contacts", [])
    user_name = db.data.get("user", {}).get("name", "Authorized User")
    notified_list = dispatch_emergency_notifications(
        user_name=user_name,
        contacts=contacts,
        incident_id=incident_id,
        share_token=share_token,
        lat=lat,
        lon=lon,
        battery=battery
    )

    # 4. Formulate immutable incident object
    session = {
        "sessionId": incident_id,
        "status": "ACTIVE",
        "triggerType": trigger_type,
        "startedAt": now_iso,
        "startingLocation": {
            "latitude": lat,
            "longitude": lon,
            "accuracyMeters": accuracy_m,
            "timestamp": now_iso
        },
        "latestLocation": {
            "latitude": lat,
            "longitude": lon,
            "accuracyMeters": accuracy_m,
            "speed": speed_mps,
            "altitude": altitude_m,
            "battery": battery,
            "networkType": network_type,
            "timestamp": now_iso
        },
        "locationBreadcrumbs": [
            {"latitude": lat, "longitude": lon, "accuracy": accuracy_m, "timestamp": now_iso}
        ],
        "shareToken": share_token,
        "shareUrl": f"/live/{share_token}",
        "notifiedContacts": notified_list,
        "evidenceCount": 0
    }

    db.data["active_sos"] = session
    db.log_audit("USER", "SOS_TRIGGERED", f"Emergency incident {incident_id} activated at ({lat}, {lon}) ±{accuracy_m}m", target_id=incident_id)
    db.save()
    return session

def update_sos_telemetry(
    lat: float,
    lon: float,
    accuracy_m: float = 8.0,
    speed_mps: Optional[float] = None,
    altitude_m: Optional[float] = None,
    battery: Optional[int] = None,
    network_type: str = "4G/5G"
) -> Optional[Dict[str, Any]]:
    """Appends live location breadcrumb and updates latest coordinates during an ongoing SOS."""
    sos = db.data.get("active_sos")
    if not sos or sos.get("status") != "ACTIVE":
        return None

    now_iso = datetime.utcnow().isoformat() + "Z"
    sos["latestLocation"] = {
        "latitude": lat,
        "longitude": lon,
        "accuracyMeters": accuracy_m,
        "speed": speed_mps,
        "altitude": altitude_m,
        "battery": battery,
        "networkType": network_type,
        "timestamp": now_iso
    }
    sos["locationBreadcrumbs"].append({
        "latitude": lat,
        "longitude": lon,
        "accuracy": accuracy_m,
        "timestamp": now_iso
    })

    # Update token record
    token = sos.get("shareToken")
    if token and token in db.data.get("location_shares", {}):
        share = db.data["location_shares"][token]
        share["latitude"] = lat
        share["longitude"] = lon
        share["accuracyMeters"] = accuracy_m
        share["battery"] = battery
        share["networkType"] = network_type

    db.save()
    return sos["latestLocation"]

def resolve_sos_session(resolution_note: str = "Resolved by user (I am safe)") -> Optional[Dict[str, Any]]:
    """
    Terminates the active emergency incident upon explicit user confirmation.
    Revokes the live tracking token and moves incident to permanent history.
    """
    sos = db.data.get("active_sos")
    if not sos:
        return None

    now_iso = datetime.utcnow().isoformat() + "Z"
    sos["status"] = "RESOLVED"
    sos["resolvedAt"] = now_iso
    sos["resolutionNote"] = resolution_note

    # Revoke temporary tracking link
    token = sos.get("shareToken")
    if token and token in db.data.get("location_shares", {}):
        db.data["location_shares"][token]["active"] = False

    if "emergency_history" not in db.data:
        db.data["emergency_history"] = []
    db.data["emergency_history"].insert(0, dict(sos))
    db.data["active_sos"] = None

    db.log_audit("USER", "SOS_RESOLVED", f"SOS incident {sos['sessionId']} resolved: {resolution_note}", target_id=sos['sessionId'])
    db.save()
    return sos
