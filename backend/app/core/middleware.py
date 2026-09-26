import time
import uuid
import logging
from typing import Dict, Tuple
from collections import defaultdict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

logger = logging.getLogger("foodguardian.api")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = req_id
        start_time = time.time()

        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Response-Time"] = f"{process_time:.2f}ms"

            # Structured logging
            logger.info(
                f"[{req_id}] {request.method} {request.url.path} "
                f"status={response.status_code} duration={process_time:.2f}ms"
            )
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"[{req_id}] Unhandled error on {request.method} {request.url.path}: {str(e)}",
                exc_info=True
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "An unexpected server error occurred.",
                        "details": {},
                        "request_id": req_id
                    }
                },
                headers={"X-Request-ID": req_id}
            )


class SimpleRateLimiter:
    """Sliding-window in-memory rate limiter per client IP"""
    def __init__(self, limit_per_minute: int = 60):
        self.limit = limit_per_minute
        self.history: Dict[str, list] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int, int]:
        now = time.time()
        window_start = now - 60.0
        # purge old entries
        self.history[client_ip] = [t for t in self.history[client_ip] if t > window_start]
        count = len(self.history[client_ip])
        remaining = max(0, self.limit - count)
        if count >= self.limit:
            return False, 0, int(window_start + 60.0 - now)
        self.history[client_ip].append(now)
        return True, remaining - 1, int(window_start + 60.0 - now)


rate_limiter = SimpleRateLimiter(limit_per_minute=settings.RATE_LIMIT_PER_MINUTE)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude docs, openapi, and health from strict rate limiting
        if request.url.path in ["/api/v1/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        allowed, remaining, reset_in = rate_limiter.is_allowed(client_ip)
        
        req_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
        
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": "Rate limit exceeded. Please retry after some moments.",
                        "details": {"retry_after_seconds": reset_in},
                        "request_id": req_id
                    }
                },
                headers={
                    "X-RateLimit-Limit": str(settings.RATE_LIMIT_PER_MINUTE),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(reset_in),
                    "X-Request-ID": req_id
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response


def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", "req_unknown")
        errors = exc.errors()
        first_error_msg = errors[0].get("msg", "Validation error") if errors else "Validation failed"
        first_loc = " -> ".join([str(l) for l in errors[0].get("loc", [])]) if errors else ""
        message = f"Field validation failed: {first_loc} ({first_error_msg})" if first_loc else first_error_msg
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": message,
                    "details": {"errors": errors},
                    "request_id": req_id
                }
            },
            headers={"X-Request-ID": req_id}
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = getattr(request.state, "request_id", "req_unknown")
        
        code_map = {
            400: "INVALID_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "VALIDATION_ERROR",
            429: "RATE_LIMITED",
            500: "INTERNAL_ERROR",
            503: "SERVICE_UNAVAILABLE"
        }
        err_code = code_map.get(exc.status_code, "ERROR")

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": err_code,
                    "message": str(exc.detail),
                    "details": {},
                    "request_id": req_id
                }
            },
            headers={"X-Request-ID": req_id}
        )
