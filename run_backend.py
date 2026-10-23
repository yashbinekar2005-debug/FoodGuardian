import os
import sys

# Ensure backend directory is in sys.path and PYTHONPATH using absolute paths
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = current_dir if os.path.basename(current_dir) == "backend" else os.path.join(current_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure reloader child processes have backend in PYTHONPATH
existing_pythonpath = os.environ.get("PYTHONPATH", "")
if backend_dir not in existing_pythonpath:
    os.environ["PYTHONPATH"] = f"{backend_dir}{os.pathsep}{existing_pythonpath}".rstrip(os.pathsep)

if __name__ == "__main__":
    import uvicorn
    # pyrefly: ignore[missing-import]
    from app.core.config import settings
    print(f"Starting FoodGuardian API Server on {settings.API_HOST}:{settings.API_PORT}...")
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        reload_dirs=[backend_dir],
        app_dir=backend_dir
    )
