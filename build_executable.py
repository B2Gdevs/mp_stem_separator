#!/usr/bin/env python3
"""
Build script for creating Stem Separator executable
"""
import subprocess
import sys
import shutil
import os
from pathlib import Path

def build_frontend():
    """Build the React frontend"""
    print("🔨 Building React frontend...")
    frontend_dir = Path("frontend")
    
    # Check if frontend exists
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Run npm build
    try:
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        print("✅ Frontend build completed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Frontend build failed")
        return False

def build_executable():
    """Build the executable using PyInstaller"""
    print("🔨 Building Stem Separator executable...")
    
    # Build frontend first
    if not build_frontend():
        return 1
    
    # Clean previous builds
    for dir_name in ['build', 'dist']:
        if Path(dir_name).exists():
            shutil.rmtree(dir_name)
    
    # PyInstaller command with all necessary options
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "StemSeparator",
        "--onedir",  # Use onedir instead of onefile for better compatibility
        "--console",  # Show console window
        # Include data files
        "--add-data", f"app{os.pathsep}app",
        "--add-data", f"frontend/build{os.pathsep}frontend/build",
        # Hidden imports for FastAPI
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        # Additional hidden imports
        "--hidden-import", "app.api.audio",
        "--hidden-import", "app.api.jobs",
        "--hidden-import", "app.core.config",
        "--hidden-import", "app.services.audio_processor",
        "--hidden-import", "app.services.job_manager",
        "--hidden-import", "app.models.audio",
        "app_runner.py"
    ]
    
    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print("\n✅ Build completed successfully!")
        print(f"Executable location: dist/StemSeparator/")
        print("\nTo run the app:")
        print("  ./dist/StemSeparator/StemSeparator")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(build_executable()) 