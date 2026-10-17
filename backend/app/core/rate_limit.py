import threading
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    """Allow at most ``max_events`` per key inside a rolling window of ``window_seconds``."""

    def __init__(self, max_events: int, window_seconds: float) -> None:
        self._max_events = max_events
        self._window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            window = self._events[key]
            while window and now - window[0] > self._window_seconds:
                window.popleft()
            if len(window) >= self._max_events:
                return False
            window.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._events.clear()
