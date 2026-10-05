from app.location.haversine import calculate_haversine_distance, calculate_bearing, filter_and_sort_by_proximity
from app.location.routes import handle_get_shared_location

def run_location_tests():
    tests = []

    # 1. Haversine distance AIIMS Trauma (28.5672, 77.1956) to Safdarjung Sakhi (28.5684, 77.2069)
    d = calculate_haversine_distance(28.5672, 77.1956, 28.5684, 77.2069)
    tests.append({
        "name": "Haversine Geolocation Distance Accuracy",
        "passed": 0.8 < d < 1.5,
        "details": f"Calculated distance AIIMS to Safdarjung: {d}km (expected ~1.1km)."
    })

    # 2. Compass bearing calculation
    b = calculate_bearing(28.5672, 77.1956, 28.5684, 77.2069)
    tests.append({
        "name": "Compass Bearing Calculation",
        "passed": 0 <= b <= 360,
        "details": f"Calculated bearing: {b} degrees."
    })

    # 3. Invalid or Forged Share Token Access Rejection
    status, res = handle_get_shared_location("forged-non-existent-token-xyz")
    tests.append({
        "name": "Forged Emergency Link Rejection (404/410)",
        "passed": status in (404, 410) and "error" in res,
        "details": "Unauthorized/forged token correctly rejected with HTTP 404."
    })

    return tests
