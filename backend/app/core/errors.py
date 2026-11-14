"""Consistent error responses.

Every error body is  {"detail": "<message>"}  or  {"detail": {"code": "...", "message": "..."}}
which is what the frontend's api.js expects. Validation errors keep FastAPI's
list format but each message names the field.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

log = logging.getLogger("lumora")


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code, self.code, self.message = status_code, code, message


def not_found(what: str = "Item") -> AppError:
    return AppError(404, "NOT_FOUND", f"{what} not found.")


def _field(loc) -> str:
    parts = [str(p) for p in loc if p not in ("body", "query", "path")]
    return ".".join(parts) or "request"


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content={"detail": {"code": exc.code, "message": exc.message}})

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError):
        errors = []
        for e in exc.errors():
            msg = e.get("msg", "Invalid value").removeprefix("Value error, ")
            errors.append({"loc": list(e.get("loc", [])), "msg": f"{_field(e.get('loc', []))}: {msg}",
                           "type": e.get("type")})
        return JSONResponse(status_code=422, content={"detail": errors})

    @app.exception_handler(IntegrityError)
    async def integrity_error(_: Request, exc: IntegrityError):
        log.warning("Integrity error: %s", exc.orig)
        return JSONResponse(status_code=409, content={"detail": {"code": "CONFLICT",
                                                                 "message": "That conflicts with existing data."}})

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):
        log.exception("Unhandled error", exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": {"code": "SERVER_ERROR",
                                                                 "message": "The server ran into a problem."}})
