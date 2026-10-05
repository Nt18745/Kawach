import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import json
from datetime import datetime
from app.database.db import db
from app.tests.test_auth import run_auth_tests
from app.tests.test_sos import run_sos_tests
from app.tests.test_location import run_location_tests
from app.tests.test_security import run_security_tests
from app.tests.test_load import run_load_tests

def run_all_tests():
    """
    Executes the comprehensive automated regression and load test suites.
    CRITICAL: Preserves isolated state so persistent user database is never polluted.
    """
    snapshot = json.loads(json.dumps(db.data))
    original_save = db.save
    db.save = lambda: None  # Intercept file writes during testing

    all_results = []
    try:
        all_results.extend(run_auth_tests())
        all_results.extend(run_sos_tests())
        all_results.extend(run_location_tests())
        all_results.extend(run_security_tests())
        all_results.extend(run_load_tests(num_requests=50))
    finally:
        db.data = snapshot
        db.save = original_save

    passed_count = sum(1 for t in all_results if t.get("passed"))
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "totalTests": len(all_results),
        "passedCount": passed_count,
        "allPassed": passed_count == len(all_results),
        "tests": all_results
    }

if __name__ == "__main__":
    result = run_all_tests()
    print(f"Results: {result['passedCount']}/{result['totalTests']} passed (allPassed: {result['allPassed']})")
    for t in result["tests"]:
        status = "✓ PASS" if t.get("passed") else "✗ FAIL"
        print(f"  {status} - {t.get('name')}: {t.get('details', '')}")
    if not result["allPassed"]:
        sys.exit(1)
