import os
import time
from datetime import datetime
from typing import Dict, Any, Tuple
from app.database.db import db
from app.config.settings import SERVER_PORT

START_TIME = time.time()

def check_system_health() -> Tuple[int, Dict[str, Any]]:
    uptime_sec = int(time.time() - START_TIME)
    db_alive = os.path.exists(db.filepath)

    status_data = {
        "status": "healthy" if db_alive else "degraded",
        "service": "KAWACH-Python-Core",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptimeSeconds": uptime_sec,
        "database": {
            "status": "connected" if db_alive else "error",
            "path": db.filepath,
            "userLoaded": bool(db.data.get("user")),
            "contactCount": len(db.data.get("contacts", [])),
            "emergencyNumbersCount": len(db.data.get("emergency_numbers", []))
        },
        "activeEmergency": bool(db.data.get("active_sos")),
        "activeSosId": (db.data.get("active_sos") or {}).get("sessionId")
    }
    return 200, status_data

def get_audit_logs() -> Tuple[int, Dict[str, Any]]:
    logs = db.data.get("audit_logs", [])
    return 200, {
        "success": True,
        "count": len(logs),
        "auditLogs": list(reversed(logs[-100:]))
    }
