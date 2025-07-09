"""
Stem Separator API - Main Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import audio, jobs
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="Stem Separator API",
    description="API for separating audio tracks into stems using Demucs",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (must be before catch-all)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "stem-separator"}

# Include routers
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])

# Serve static files from React build
frontend_build_path = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build_path.exists():
    # Mount static files first
    app.mount("/static", StaticFiles(directory=frontend_build_path / "static"), name="static")
    
    # Serve index.html for root
    @app.get("/", response_class=FileResponse)
    async def serve_frontend():
        return FileResponse(frontend_build_path / "index.html")
    
    # Serve favicon and other static files at root level
    @app.get("/favicon.ico", response_class=FileResponse)
    async def serve_favicon():
        return FileResponse(frontend_build_path / "favicon.ico")
    
    @app.get("/manifest.json", response_class=FileResponse)
    async def serve_manifest():
        return FileResponse(frontend_build_path / "manifest.json")
    
    @app.get("/robots.txt", response_class=FileResponse)
    async def serve_robots():
        return FileResponse(frontend_build_path / "robots.txt")
    
    @app.get("/logo192.png", response_class=FileResponse)
    async def serve_logo192():
        return FileResponse(frontend_build_path / "logo192.png")
    
    @app.get("/logo512.png", response_class=FileResponse)
    async def serve_logo512():
        return FileResponse(frontend_build_path / "logo512.png")
    
    # Catch-all for React Router - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Check if it's a static file first
        static_file = frontend_build_path / full_path
        if static_file.exists() and static_file.is_file():
            return FileResponse(static_file)
        
        # For anything else (React Router paths), serve index.html
        return FileResponse(frontend_build_path / "index.html")
else:
    @app.get("/", response_class=HTMLResponse)
    async def root():
        """Root endpoint with welcome message"""
        return """
        <html>
            <head>
                <title>Stem Separator API</title>
            </head>
            <body>
                <h1>Welcome to Stem Separator API</h1>
                <p>Upload audio files to separate them into individual stems (vocals, drums, bass, other).</p>
                <p>Visit <a href="/docs">/docs</a> for API documentation.</p>
            </body>
        </html>
        """ 