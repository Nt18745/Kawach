"""
HER-SAFE (Kawach) Women's Personal Safety & Emergency Guardian Platform
Modular Python Backend Entrypoint & Service Launcher
"""

import sys
from app.config.settings import SERVER_PORT, SERVER_HOST
from app.main import run_server
from app.tests.runner import run_all_tests

def main():
    args = sys.argv[1:]

    if "--test" in args or "-t" in args:
        print("Running KAWACH comprehensive test suite...")
        res = run_all_tests()
        for t in res.get("tests", []):
            mark = "PASS" if t.get("passed") else "FAIL"
            print(f"[{mark}] {t.get('name')}: {t.get('details')}")
        print(f"Tests complete: {res.get('passedCount')}/{res.get('totalTests')} passed.")
        if not res.get("allPassed"):
            sys.exit(1)

    elif "--serve" in args or "-s" in args:
        port = SERVER_PORT
        for i, a in enumerate(args):
            if a in ("--serve", "-s") and i + 1 < len(args):
                try:
                    port = int(args[i + 1])
                except ValueError:
                    pass
        run_server(port=port, host=SERVER_HOST)

    else:
        res = run_all_tests()
        print(f"KAWACH Python Engine initialized: {res.get('passedCount')}/{res.get('totalTests')} tests passed.")

if __name__ == "__main__":
    main()
