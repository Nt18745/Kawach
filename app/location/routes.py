from datetime import datetime
from typing import Dict, Any, Tuple
from app.database.db import db
from app.location.haversine import filter_and_sort_by_proximity

def handle_get_nearby_facilities(params: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    lat = float(params.get("latitude", 28.5694))
    lon = float(params.get("longitude", 77.2062))
    radius = float(params.get("radiusKm", 25.0))
    category = params.get("category")

    all_facs = db.data.get("facilities", [])
    if category and category.lower() != "all":
        all_facs = [f for f in all_facs if f.get("category", "").lower() == category.lower()]

    matched = filter_and_sort_by_proximity(lat, lon, all_facs, radius)
    return 200, {
        "success": True,
        "count": len(matched),
        "radiusKm": radius,
        "facilities": matched
    }

def handle_get_shared_location(token: str) -> Tuple[int, Dict[str, Any]]:
    """
    Validates cryptographic temporary emergency tracking token.
    Enforces expiration and active revocation.
    """
    shares = db.data.get("location_shares", {})
    record = shares.get(token)

    if not record:
        return 404, {"error": "Emergency tracking link not found or invalid."}

    if not record.get("active", True):
        return 410, {"error": "Emergency tracking link has been safely revoked by the user."}

    expires_at_str = record.get("expiresAt")
    if expires_at_str:
        try:
            exp = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if datetime.now(exp.tzinfo) > exp:
                record["active"] = False
                db.save()
                return 410, {"error": "Emergency tracking link has expired."}
        except Exception:
            pass

    # Log authorized token view in audit log
    record["accessCount"] = record.get("accessCount", 0) + 1
    record["lastAccessedAt"] = datetime.utcnow().isoformat() + "Z"
    db.save()

    # Find associated active SOS or journey
    session_id = record.get("sessionId")
    active_sos = db.data.get("active_sos")
    breadcrumbs = []
    if active_sos and active_sos.get("sessionId") == session_id:
        breadcrumbs = active_sos.get("locationBreadcrumbs", [])

    return 200, {
        "success": True,
        "active": True,
        "latitude": record.get("latitude"),
        "longitude": record.get("longitude"),
        "accuracyMeters": record.get("accuracyMeters", 8.0),
        "speed": record.get("speed"),
        "altitude": record.get("altitude"),
        "battery": record.get("battery"),
        "networkType": record.get("networkType", "4G/5G"),
        "updatedAt": record.get("createdAt"),
        "expiresAt": record.get("expiresAt"),
        "breadcrumbs": breadcrumbs
    }
