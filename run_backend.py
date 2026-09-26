import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    print(f"Starting FoodGuardian API Server on {settings.API_HOST}:{settings.API_PORT}...")
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        reload_dirs=[backend_dir]
    )
