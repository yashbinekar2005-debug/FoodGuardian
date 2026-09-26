from fastapi import APIRouter
from app.api.v1.analyze import router as analyze_router
from app.api.v1.products import router as products_router
from app.api.v1.ingredients import router as ingredients_router
from app.api.v1.additives import router as additives_router
from app.api.v1.regulations import router as regulations_router
from app.api.v1.rules import router as rules_router
from app.api.v1.health import router as health_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(analyze_router)
api_v1_router.include_router(products_router)
api_v1_router.include_router(ingredients_router)
api_v1_router.include_router(additives_router)
api_v1_router.include_router(regulations_router)
api_v1_router.include_router(rules_router)
