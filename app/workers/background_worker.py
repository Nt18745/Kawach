import time
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Any

class BackgroundQueue:
    """Production asynchronous job executor for non-blocking secondary tasks."""
    def __init__(self, max_workers: int = 4):
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="KawachWorker")

    def enqueue(self, fn: Callable[..., Any], *args, **kwargs):
        """Dispatches job asynchronously so emergency responses remain sub-second."""
        return self._executor.submit(fn, *args, **kwargs)

    def shutdown(self):
        self._executor.shutdown(wait=False)

worker_queue = BackgroundQueue()
