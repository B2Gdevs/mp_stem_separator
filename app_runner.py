#!/usr/bin/env python3
"""
Stem Separator Executable Runner
This script serves as the entry point for the packaged executable.
"""
import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent
sys.path.insert(0, str(app_dir))

# Set environment variables
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"  # For macOS Metal Performance Shaders

def open_browser():
    """Open the web browser after a short delay"""
    time.sleep(2)  # Wait for server to start
    webbrowser.open("http://localhost:8000")

def run_demucs():
    """Run demucs with the provided arguments"""
    import subprocess
    
    # Get the original arguments: ["-m", "demucs", "-n", "htdemucs", "-o", "output_dir", "input_file"]
    demucs_args = sys.argv[1:]  # Skip script name
    
    # Build the command: python -m demucs [remaining args after -m demucs]
    cmd = ["python", "-m", "demucs"] + demucs_args[2:]  # Skip "-m" and "demucs"
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=False)
        sys.exit(result.returncode)
    except Exception as e:
        print(f"Error running demucs: {e}")
        sys.exit(1)

def main():
    """Main entry point for the executable"""
    # Check if we're being called with demucs arguments
    if len(sys.argv) > 1 and (sys.argv[1] == "-m" and len(sys.argv) > 2 and sys.argv[2] == "demucs"):
        run_demucs()
        return
    
    print("=" * 60)
    print("🎵 Stem Separator - Audio Source Separation Tool")
    print("=" * 60)
    print("\nStarting server...")
    print("The web interface will open in your browser automatically.")
    print("If it doesn't, navigate to: http://localhost:8000")
    print("\nPress Ctrl+C to stop the server and exit.")
    print("=" * 60)
    
    # Start browser opening in a separate thread
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # Import and run the FastAPI app
    import uvicorn
    from app.main import app
    
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8000,
            log_level="info",
            access_log=False,  # Reduce logging in executable
        )
    except KeyboardInterrupt:
        print("\n\nShutting down Stem Separator...")
        print("Thank you for using Stem Separator!")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        print("Press Enter to exit...")
        input()
        sys.exit(1)

if __name__ == "__main__":
    main() 