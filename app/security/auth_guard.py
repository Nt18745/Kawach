from typing import Optional, Dict, Any

ADMIN_ROLES = {
    "SUPER_ADMIN": ["manage_emergency_numbers", "verify_facilities", "view_audit_logs", "manage_admins", "system_health"],
    "SERVICE_DATA_ADMIN": ["manage_emergency_numbers", "verify_facilities", "view_audit_logs", "system_health"],
    "SUPPORT_ADMIN": ["view_audit_logs", "system_health"],
    "SYSTEM_MONITOR": ["system_health"]
}

def extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    """Extracts raw token from 'Bearer <token>' Authorization header."""
    if not auth_header:
        return None
    parts = auth_header.strip().split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    if len(parts) == 1:
        return parts[0]
    return None

def check_resource_ownership(user_id: str, resource_owner_id: str) -> bool:
    """Verifies that the authenticated user owns the resource, preventing IDOR vulnerability."""
    return bool(user_id and resource_owner_id and user_id == resource_owner_id)

def has_admin_permission(admin_role: str, required_permission: str) -> bool:
    """Checks whether the admin role possesses the specific granular permission."""
    perms = ADMIN_ROLES.get(admin_role, [])
    return required_permission in perms
