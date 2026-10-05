import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Tuple

class RateLimiter:
    """
    Sliding-window in-memory rate limiter with emergency bypass.
    Prevents brute-force, scraping, and denial-of-service abuse.
    """
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, client_key: str, max_requests: int, window_seconds: int = 60, is_emergency: bool = False) -> Tuple[bool, int]:
        """
        Checks if client request is within threshold.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        # Absolute Priority: Emergency SOS requests are never rate-limited
        if is_emergency:
            return True, 0

        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._requests[client_key]
            # Prune old timestamps
            valid = [ts for ts in timestamps if ts > cutoff]
            self._requests[client_key] = valid

            if len(valid) >= max_requests:
                earliest = valid[0]
                retry_after = max(1, int(window_seconds - (now - earliest)))
                return False, retry_after

            self._requests[client_key].append(now)
            return True, 0

    def cleanup(self):
        """Cleans up stale clients to prevent memory buildup."""
        now = time.time()
        with self._lock:
            stale_keys = [k for k, v in self._requests.items() if not v or (now - v[-1]) > 300]
            for k in stale_keys:
                del self._requests[k]

rate_limiter = RateLimiter()
