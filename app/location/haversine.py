import math
from typing import Dict, Any, List, Optional

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    r_earth = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    r_lat1 = math.radians(lat1)
    r_lat2 = math.radians(lat2)

    a = math.sin(d_lat / 2.0) ** 2 + math.cos(r_lat1) * math.cos(r_lat2) * math.sin(d_lon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r_earth * c, 2)

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates forward azimuth / compass bearing in degrees (0 - 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    theta = math.atan2(y, x)
    return round((math.degrees(theta) + 360.0) % 360.0, 1)

def filter_and_sort_by_proximity(user_lat: float, user_lon: float, items: List[Dict[str, Any]], radius_km: float = 25.0) -> List[Dict[str, Any]]:
    """Calculates distance, drive minutes, and sorts items by distance within radius."""
    results = []
    for item in items:
        if "latitude" not in item or "longitude" not in item:
            continue
        dist = calculate_haversine_distance(user_lat, user_lon, float(item["latitude"]), float(item["longitude"]))
        if dist <= radius_km:
            c = dict(item)
            c["distance_km"] = dist
            c["estimated_drive_min"] = max(2, int(dist * 3.0))
            c["bearing_deg"] = calculate_bearing(user_lat, user_lon, float(item["latitude"]), float(item["longitude"]))
            c["google_maps_url"] = f"https://www.google.com/maps/search/?api=1&query={item['latitude']},{item['longitude']}"
            c["directions_url"] = f"https://www.google.com/maps/dir/?api=1&origin={user_lat},{user_lon}&destination={item['latitude']},{item['longitude']}"
            results.append(c)
    results.sort(key=lambda x: x["distance_km"])
    return results
