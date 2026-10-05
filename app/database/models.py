from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
from datetime import datetime

def utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

@dataclass
class User:
    id: str
    name: str
    phone: str
    email: str
    bloodGroup: str = "O+"
    emergencyMedicalNotes: str = ""
    countdownSeconds: int = 3
    preferredLanguage: str = "en"
    themeVariant: str = "crimson"
    pinHash: str = ""
    darkMode: bool = True
    highContrast: bool = False
    age: int = 24
    isMinor: bool = False
    guardianConsentVerified: bool = True
    createdAt: str = field(default_factory=utc_now_iso)
    updatedAt: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d.pop("pinHash", None)  # Never expose hashed security PIN in sanitized dict
        return d

@dataclass
class TrustedContact:
    id: str
    userId: str
    name: str
    phone: str
    relationship: str = "Family"
    isEmergencyContact: bool = True
    priority: int = 1
    alertsEnabled: bool = True
    verificationStatus: str = "verified"  # verified, pending, unverified
    createdAt: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class LocationPoint:
    latitude: float
    longitude: float
    accuracyMeters: float = 8.0
    speed: Optional[float] = None
    altitude: Optional[float] = None
    battery: Optional[int] = None
    networkType: Optional[str] = "4G/5G"
    timestamp: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class EmergencyIncident:
    sessionId: str
    userId: str
    status: str  # ACTIVE, RESOLVED, CANCELLED
    triggerType: str = "button"  # button, voice, hardware, timer_escalation
    startedAt: str = field(default_factory=utc_now_iso)
    startingLocation: Optional[Dict[str, Any]] = None
    latestLocation: Optional[Dict[str, Any]] = None
    locationBreadcrumbs: List[Dict[str, Any]] = field(default_factory=list)
    shareToken: str = ""
    shareUrl: str = ""
    notifiedContacts: List[Dict[str, Any]] = field(default_factory=list)
    resolvedAt: Optional[str] = None
    resolutionNote: Optional[str] = None
    evidenceCount: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class EvidenceRecording:
    id: str
    incidentId: str
    userId: str
    title: str
    type: str  # audio_recording, video_clip, photo_snapshot, sensor_telemetry
    fileSizeBytes: int
    sha256Hash: str
    mimeType: str = "audio/wav"
    timestamp: str = field(default_factory=utc_now_iso)
    retentionDays: int = 30
    verifiedTamperProof: bool = True
    storageUri: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class AuditLog:
    id: str
    timestamp: str = field(default_factory=utc_now_iso)
    actorId: str = "SYSTEM"
    actorRole: str = "SYSTEM"
    action: str = ""
    targetEntity: str = ""
    details: str = ""
    targetId: Optional[str] = None
    ipAddress: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
