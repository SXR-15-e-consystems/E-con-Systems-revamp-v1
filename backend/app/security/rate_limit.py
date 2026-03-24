import time
from collections import defaultdict
from threading import Lock

# In-memory sliding window. For production, replace with Redis-based limiter.
_store: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> bool:
    """Return True if the key has exceeded the limit in the time window.

    Args:
        key: Identifier (e.g., "login:{ip}").
        max_requests: Max allowed requests in window.
        window_seconds: Sliding window size in seconds.
    """
    now = time.monotonic()
    with _lock:
        _store[key] = [t for t in _store[key] if now - t < window_seconds]
        if len(_store[key]) >= max_requests:
            return True
        _store[key].append(now)
        return False
