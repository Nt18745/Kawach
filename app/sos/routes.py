from typing import Dict, Any, Tuple
from app.database.db import db
from app.sos.sos_engine import trigger_sos_session, update_sos_telemetry, resolve_sos_session

def handle_sos_trigger(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    lat = float(payload.get("latitude", 28.5694))
    lon = float(payload.get("longitude", 77.2062))
    acc = float(payload.get("accuracyMeters", 8.0))
    speed = payload.get("speed")
    alt = payload.get("altitude")
    battery = payload.get("battery")
    net = payload.get("networkType", "4G/5G")
    trigger_type = payload.get("triggerType", "button")

    session = trigger_sos_session(
        lat=lat,
        lon=lon,
        accuracy_m=acc,
        speed_mps=speed,
        altitude_m=alt,
        battery=battery,
        network_type=net,
        trigger_type=trigger_type
    )
    return 201, {"success": True, "session": session}

def handle_sos_update_location(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    lat = float(payload.get("latitude", 28.5694))
    lon = float(payload.get("longitude", 77.2062))
    acc = float(payload.get("accuracyMeters", 8.0))
    speed = payload.get("speed")
    alt = payload.get("altitude")
    battery = payload.get("battery")
    net = payload.get("networkType", "4G/5G")

    updated = update_sos_telemetry(
        lat=lat,
        lon=lon,
        accuracy_m=acc,
        speed_mps=speed,
        altitude_m=alt,
        battery=battery,
        network_type=net
    )
    if not updated:
        return 404, {"error": "No active emergency session found to update."}
    return 200, {"success": True, "location": updated}

def handle_sos_resolve(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    note = payload.get("note", "Resolved by user (I am safe)")
    resolved = resolve_sos_session(resolution_note=note)
    if not resolved:
        return 404, {"error": "No active emergency session found to resolve."}
    return 200, {"success": True, "resolved": resolved}

def handle_sos_status() -> Tuple[int, Dict[str, Any]]:
    return 200, {
        "success": True,
        "activeSos": db.data.get("active_sos"),
        "hasActiveSession": bool(db.data.get("active_sos"))
    }

def handle_sos_history() -> Tuple[int, Dict[str, Any]]:
    return 200, {
        "success": True,
        "count": len(db.data.get("emergency_history", [])),
        "history": db.data.get("emergency_history", [])
    }
