"""
FastAPI application main module
"""
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api import audio, jobs

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="Audio stem separation service using Demucs"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])

# Database lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    print("Database initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    await close_db()
    print("Database connections closed")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "stem-separator"}

# Serve React static files
frontend_path = Path(__file__).parent.parent / "frontend" / "build"

if frontend_path.exists():
    # Mount static files
    app.mount("/static", StaticFiles(directory=frontend_path / "static"), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(request: Request, full_path: str):
        """
        Serve React app for all non-API routes
        """
        # Don't interfere with API routes
        if full_path.startswith("api/") or full_path == "health":
            return {"error": "Not found"}
        
        # Try to serve specific file first
        file_path = frontend_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Default to index.html for SPA routing
        return FileResponse(frontend_path / "index.html")

else:
    @app.get("/")
    async def root():
        return {
            "message": "Stem Separator API", 
            "frontend": "Not built yet. Run 'cd frontend && npm run build'",
            "docs": "/docs"
        } 