from typing import Dict, Any, Tuple
from app.database.db import db
from app.recordings.vault_service import store_incident_evidence, get_vault_storage_metrics

def handle_upload_evidence(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    title = payload.get("title", "SOS Emergency Voice Recording")
    etype = payload.get("type", "audio_recording")
    size = int(payload.get("fileSizeBytes", 1024 * 64))
    data = payload.get("payloadData")
    mime = payload.get("mimeType", "audio/wav")
    inc_id = payload.get("incidentId")

    return store_incident_evidence(
        title=title,
        evidence_type=etype,
        file_size_bytes=size,
        payload_data=data,
        mime_type=mime,
        incident_id=inc_id
    )

def handle_get_storage_metrics() -> Tuple[int, Dict[str, Any]]:
    return 200, get_vault_storage_metrics()

def handle_get_evidence_list() -> Tuple[int, Dict[str, Any]]:
    vault = db.data.get("evidence_vault", [])
    return 200, {
        "success": True,
        "count": len(vault),
        "evidence": vault
    }
