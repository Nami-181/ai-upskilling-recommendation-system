"""Reject NUL characters in any request (found by the Lab 7 fuzz tests).

PostgreSQL text columns cannot store U+0000, so a NUL inside any JSON string, query
parameter or path segment used to reach the database and fail with a 500. This
global dependency turns it into a normal 422 validation error before any route runs.
"""
import re
from urllib.parse import unquote

from fastapi import Request

from app.core.errors import AppError

# A JSON escape \u0000 that is not itself preceded by an escaping backslash.
_JSON_NUL = re.compile(rb"(?<!\\)(?:\\\\)*\\u0000", re.IGNORECASE)


async def reject_nul_bytes(request: Request) -> None:
    body = await request.body()  # cached by Starlette, so the route can still read it
    if b"\x00" in body or _JSON_NUL.search(body) \
            or "\x00" in unquote(request.url.path) or "\x00" in unquote(request.url.query):
        raise AppError(422, "INVALID_CHARACTERS", "Input must not contain NUL characters.")
