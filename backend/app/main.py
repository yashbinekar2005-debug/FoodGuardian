import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import (
    RequestContextMiddleware,
    RateLimitMiddleware,
    setup_exception_handlers
)
from app.api.v1.router import api_v1_router
from app.db.seed import seed_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("foodguardian")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FoodGuardian API Engine...")
    try:
        await seed_database()
        logger.info("FoodGuardian database initialized with verified regulatory reference rules.")
    except Exception as e:
        logger.error(f"Error during startup database seeding: {e}", exc_info=True)
    yield
    logger.info("Shutting down FoodGuardian API Engine...")


app = FastAPI(
    title="FoodGuardian API",
    description="Backend intelligence API for FoodGuardian packaged-food safety, ingredient decoding, additive identification, nutrition analysis, and India vs EU regulatory intelligence.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# 1. Custom Exception Handlers (Standardized error envelope)
setup_exception_handlers(app)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.CORS_ORIGINS == ["*"] else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining"]
)

# 3. Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware)

# 4. Request Context & Structured Logging Middleware
app.add_middleware(RequestContextMiddleware)

# 5. Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "FoodGuardian API",
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
