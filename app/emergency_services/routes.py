from typing import Dict, Any, Tuple
from app.database.db import db
from app.emergency_services.directory import DEFAULT_INTERNATIONAL_NUMBERS

def handle_get_emergency_numbers(params: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    country = params.get("country")
    category = params.get("category")
    search = params.get("search")

    numbers = db.data.get("emergency_numbers") or DEFAULT_INTERNATIONAL_NUMBERS

    filtered = []
    for item in numbers:
        if country and country.lower() != "all" and item.get("country", "").lower() != country.lower():
            continue
        if category and category.lower() != "all" and item.get("category", "").lower() != category.lower():
            continue
        if search:
            q = search.lower()
            text_pool = f"{item.get('service','')} {item.get('number','')} {item.get('category','')} {item.get('country','')}".lower()
            if q not in text_pool:
                continue
        filtered.append(item)

    return 200, {
        "success": True,
        "count": len(filtered),
        "numbers": filtered
    }

def handle_add_emergency_number(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    """Admin function: Adds a verified official emergency service number."""
    service = payload.get("service")
    number = payload.get("number")
    country = payload.get("country", "India")
    category = payload.get("category", "General")
    source = payload.get("source", "Official Gazette")

    if not service or not number:
        return 400, {"error": "Service name and emergency number are required."}

    new_num = {
        "id": f"num-{country[:2].lower()}-{number.replace('-', '')}",
        "country": country,
        "countryCode": payload.get("countryCode", "+91"),
        "service": service,
        "number": number,
        "category": category,
        "source": source,
        "verified": True,
        "lastVerified": "2026-03-01"
    }

    if "emergency_numbers" not in db.data:
        db.data["emergency_numbers"] = list(DEFAULT_INTERNATIONAL_NUMBERS)
    db.data["emergency_numbers"].append(new_num)
    db.log_audit("ADMIN", "EMERGENCY_NUMBER_ADDED", f"Added verified number {number} ({service})", target_id=new_num["id"])
    db.save()

    return 201, {"success": True, "emergencyNumber": new_num}
