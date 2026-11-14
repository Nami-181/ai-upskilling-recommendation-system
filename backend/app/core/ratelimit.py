"""Sliding-window rate limit for public auth endpoints (NFR-011).

In-memory and per process: enough for a single Render instance. With several
instances, move the counters to Redis.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request

from app.core.config import settings
from app.core.errors import AppError

WINDOW_SECONDS = 60
_hits: dict[tuple[str, str], deque] = defaultdict(deque)
_lock = Lock()


def reset() -> None:
    with _lock:
        _hits.clear()


def auth_rate_limit(request: Request) -> None:
    limit = settings.AUTH_RATE_LIMIT_PER_MINUTE
    if limit <= 0:
        return
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    key, now = (ip, request.url.path), time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > WINDOW_SECONDS:
            q.popleft()
        if len(q) >= limit:
            raise AppError(429, "RATE_LIMITED", "Too many attempts. Please wait a minute and try again.")
        q.append(now)
