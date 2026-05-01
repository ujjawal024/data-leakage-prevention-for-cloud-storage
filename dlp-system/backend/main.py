"""
main.py — FastAPI application entry point.
Registers all routers, configures CORS, and initialises the database on startup.
In LOCAL mode, serves uploaded files via GET /dev-download/{file_key}.
"""

import os
import pathlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from routes.auth_routes  import router as auth_router
from routes.file_routes  import router as file_router
from routes.admin_routes import router as admin_router

# ──────────────────────────────────────────────
# Lifespan: create DB tables on startup
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables at startup."""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables initialised")
    yield

# ──────────────────────────────────────────────
# Application factory
# ──────────────────────────────────────────────

app = FastAPI(
    title       = "DLP Shield API",
    description = "Data Leakage Prevention middleware for cloud storage",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# ── CORS (allow all origins in dev; restrict in production) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Register routers ──
app.include_router(auth_router)
app.include_router(file_router)
app.include_router(admin_router)


# ──────────────────────────────────────────────
# Dev-download route (LOCAL adapter only)
# ──────────────────────────────────────────────

CLOUD_PROVIDER     = os.getenv("CLOUD_PROVIDER", "local").lower()
LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "./local_storage")

if CLOUD_PROVIDER == "local":
    local_dir = pathlib.Path(LOCAL_STORAGE_PATH).resolve()
    local_dir.mkdir(parents=True, exist_ok=True)

    @app.get("/dev-download/{file_key:path}")
    def dev_download(
        file_key: str,
        filename: str = Query(default=None, description="Original filename for Content-Disposition"),
    ):
        """Serve a locally stored file for development purposes."""
        # Resolve the target path and verify it stays inside local_dir
        target = (local_dir / file_key).resolve()
        if not str(target).startswith(str(local_dir)):
            raise HTTPException(status_code=400, detail="Invalid file path")
        if not target.exists():
            raise HTTPException(status_code=404, detail="File not found in local storage")
        # Use the original filename if provided, otherwise fall back to the UUID key name
        download_name = filename if filename else target.name
        return FileResponse(
            path       = str(target),
            filename   = download_name,
            media_type = "application/octet-stream",
        )


# ──────────────────────────────────────────────
# Health-check
# ──────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "DLP Shield API"}
