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

def main():
    """Main entry point for the executable"""
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