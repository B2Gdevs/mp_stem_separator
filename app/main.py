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

# Serve Next.js static files
frontend_path = Path(__file__).parent.parent / "frontend" / "build"

if frontend_path.exists():
    # Mount static assets (_next folder, etc.)
    if (frontend_path / "_next").exists():
        app.mount("/_next", StaticFiles(directory=frontend_path / "_next"), name="nextjs_assets")
    
    # Mount any other static assets
    static_dirs = ["images", "icons", "static"]
    for static_dir in static_dirs:
        static_path = frontend_path / static_dir
        if static_path.exists():
            app.mount(f"/{static_dir}", StaticFiles(directory=static_path), name=static_dir)
    
    @app.get("/{full_path:path}")
    async def serve_nextjs_app(request: Request, full_path: str):
        """
        Serve Next.js app for all non-API routes
        """
        # Don't interfere with API routes
        if full_path.startswith("api/") or full_path == "health":
            return {"error": "Not found"}
        
        # Handle root path
        if full_path == "" or full_path == "/":
            return FileResponse(frontend_path / "index.html")
        
        # Try to serve specific file first
        file_path = frontend_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Try with .html extension for Next.js static export
        html_file_path = frontend_path / f"{full_path}.html"
        if html_file_path.is_file():
            return FileResponse(html_file_path)
        
        # Try index.html in subdirectory
        index_path = frontend_path / full_path / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)
        
        # Default to root index.html for SPA routing
        return FileResponse(frontend_path / "index.html")

else:
    @app.get("/")
    async def root():
        return {
            "message": "Stem Separator API", 
            "frontend": "Not built yet. Run 'cd frontend && npm run build'",
            "docs": "/docs"
        } 