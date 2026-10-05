from typing import List, Dict, Any, Optional

DEFAULT_INTERNATIONAL_NUMBERS = [
    # India (Authoritative MHA & MoWCD verified)
    {"id": "num-in-112", "country": "India", "countryCode": "+91", "service": "National Emergency All-in-One", "number": "112", "category": "All-in-One", "source": "Ministry of Home Affairs (ERSS)", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-181", "country": "India", "countryCode": "+91", "service": "Women Helpline (Sakhi / Universal)", "number": "181", "category": "Women Safety", "source": "Ministry of Women & Child Development", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-1091", "country": "India", "countryCode": "+91", "service": "Women in Distress Helpline", "number": "1091", "category": "Women Safety", "source": "State Police Command", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-100", "country": "India", "countryCode": "+91", "service": "Police Emergency", "number": "100", "category": "Police", "source": "National Police Gazette", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-108", "country": "India", "countryCode": "+91", "service": "Emergency Medical & Disaster Ambulance", "number": "108", "category": "Ambulance", "source": "National Health Mission", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-1090", "country": "India", "countryCode": "+91", "service": "Women Power Line (Anti-Harassment)", "number": "1090", "category": "Women Safety", "source": "Women Power Line Command", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-in-101", "country": "India", "countryCode": "+91", "service": "Fire & Rescue Brigade", "number": "101", "category": "Fire & Rescue", "source": "Civil Defence & Fire Services", "verified": True, "lastVerified": "2026-03-01"},
    # USA / Canada
    {"id": "num-us-911", "country": "United States", "countryCode": "+1", "service": "National Emergency 911", "number": "911", "category": "All-in-One", "source": "NENA / FCC", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-us-dv", "country": "United States", "countryCode": "+1", "service": "National Domestic Violence Hotline", "number": "1-800-799-7233", "category": "Women Safety", "source": "NDVH", "verified": True, "lastVerified": "2026-03-01"},
    # United Kingdom
    {"id": "num-uk-999", "country": "United Kingdom", "countryCode": "+44", "service": "UK Emergency Services", "number": "999", "category": "All-in-One", "source": "Home Office", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-uk-da", "country": "United Kingdom", "countryCode": "+44", "service": "National Domestic Abuse Helpline", "number": "0808 2000 247", "category": "Women Safety", "source": "Refuge UK", "verified": True, "lastVerified": "2026-03-01"},
    # Australia
    {"id": "num-au-000", "country": "Australia", "countryCode": "+61", "service": "Triple Zero (000) Emergency", "number": "000", "category": "All-in-One", "source": "ACMA", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-au-1800", "country": "Australia", "countryCode": "+61", "service": "1800RESPECT National Sexual Assault Line", "number": "1800 737 732", "category": "Women Safety", "source": "Dept of Social Services", "verified": True, "lastVerified": "2026-03-01"},
    # UAE
    {"id": "num-ae-999", "country": "United Arab Emirates", "countryCode": "+971", "service": "Police Emergency", "number": "999", "category": "Police", "source": "Dubai / Abu Dhabi Police", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-ae-wcd", "country": "United Arab Emirates", "countryCode": "+971", "service": "Dubai Foundation for Women & Children", "number": "800 111", "category": "Women Safety", "source": "DFWAC", "verified": True, "lastVerified": "2026-03-01"},
    # Singapore
    {"id": "num-sg-999", "country": "Singapore", "countryCode": "+65", "service": "Police Emergency", "number": "999", "category": "Police", "source": "Singapore Police Force", "verified": True, "lastVerified": "2026-03-01"},
    {"id": "num-sg-scwo", "country": "Singapore", "countryCode": "+65", "service": "National Anti-Violence & Harassment Helpline", "number": "1800 777 0000", "category": "Women Safety", "source": "MSF Singapore", "verified": True, "lastVerified": "2026-03-01"}
]
