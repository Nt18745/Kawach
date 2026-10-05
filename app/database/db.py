import json
import os
import tempfile
import time
from pathlib import Path
from threading import RLock
from typing import Dict, Any, List, Optional
from app.config.settings import DB_FILE, TOTAL_STORAGE_QUOTA_BYTES
from app.database.models import utc_now_iso

class ThreadSafeDatabase:
    """
    ACID-compliant JSON persistent store with in-memory caching and atomic file writes.
    Survives unexpected crashes by writing to temporary staging files before renaming.
    """
    def __init__(self, filepath: str = DB_FILE):
        self.filepath = filepath
        self._lock = RLock()
        self.data: Dict[str, Any] = {
            "user": {
                "id": "usr-01",
                "name": "Mani Ranjan Thakur",
                "phone": "+91-98765-43210",
                "email": "maniranjanthakur59@gmail.com",
                "bloodGroup": "O+",
                "emergencyMedicalNotes": "Emergency personal profile configured for Mani Ranjan Thakur",
                "countdownSeconds": 3,
                "preferredLanguage": "en",
                "themeVariant": "crimson",
                "pinHash": "f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75",
                "darkMode": True,
                "highContrast": False,
                "age": 24,
                "isMinor": False,
                "guardianConsentVerified": True
            },
            "contacts": [
                {
                    "id": "cnt-01",
                    "userId": "usr-01",
                    "name": "Priya Sharma (Sister)",
                    "phone": "+91-98111-22334",
                    "relationship": "Sister",
                    "isEmergencyContact": True,
                    "priority": 1,
                    "alertsEnabled": True,
                    "verificationStatus": "verified"
                },
                {
                    "id": "cnt-02",
                    "userId": "usr-01",
                    "name": "Vikram Sharma (Father)",
                    "phone": "+91-98222-33445",
                    "relationship": "Parent",
                    "isEmergencyContact": True,
                    "priority": 2,
                    "alertsEnabled": True,
                    "verificationStatus": "verified"
                }
            ],
            "emergency_numbers": [],
            "facilities": [],
            "active_sos": None,
            "emergency_history": [],
            "active_timer": None,
            "active_journey": None,
            "location_shares": {},
            "evidence_vault": [],
            "storage_metrics": {
                "allocatedBytes": TOTAL_STORAGE_QUOTA_BYTES,
                "usedBytes": 0,
                "fileCount": 0,
                "bucketName": "ai-studio-kawach-vault",
                "cloudProvider": "Firebase Cloud Storage / Google Cloud Object Storage"
            },
            "audit_logs": []
        }
        self.load()

    def load(self):
        """Loads state from persistent storage file if it exists."""
        with self._lock:
            if os.path.exists(self.filepath):
                try:
                    with open(self.filepath, "r", encoding="utf-8") as f:
                        saved = json.load(f)
                        self.data.update(saved)
                except Exception as err:
                    print(f"[DB] Error loading {self.filepath}: {err}")

    def save(self):
        """Atomic write: writes to temp file then performs atomic rename."""
        with self._lock:
            try:
                target_dir = os.path.dirname(os.path.abspath(self.filepath))
                os.makedirs(target_dir, exist_ok=True)
                with tempfile.NamedTemporaryFile("w", dir=target_dir, delete=False, encoding="utf-8") as tf:
                    json.dump(self.data, tf, indent=2, ensure_ascii=False)
                    temp_name = tf.name
                os.replace(temp_name, self.filepath)
            except Exception as err:
                print(f"[DB] Atomic save error: {err}")

    def log_audit(self, actor: str, action: str, details: str, target_id: Optional[str] = None):
        """Appends an immutable audit log entry."""
        with self._lock:
            entry = {
                "id": f"audit-{int(time.time() * 1000)}",
                "timestamp": utc_now_iso(),
                "actor": actor,
                "action": action,
                "details": details,
                "targetId": target_id
            }
            if "audit_logs" not in self.data:
                self.data["audit_logs"] = []
            self.data["audit_logs"].append(entry)
            if len(self.data["audit_logs"]) > 500:
                self.data["audit_logs"] = self.data["audit_logs"][-500:]
            self.save()
            return entry

db = ThreadSafeDatabase()
