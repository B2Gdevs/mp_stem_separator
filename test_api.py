#!/usr/bin/env python3
"""
Test script for Stem Separator API
"""
import requests
import time
import json
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8000"

def test_api():
    """Test the stem separator API with the example track"""
    
    # Test file
    test_file = Path("example_tracks/ben_im_so_hungry.wav")
    if not test_file.exists():
        print(f"Error: Test file not found: {test_file}")
        return
    
    print("🎵 Stem Separator API Test")
    print("=" * 50)
    
    # 1. Check health
    print("\n1. Checking API health...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.json()}")
    
    # 2. Upload file for processing
    print("\n2. Uploading audio file...")
    with open(test_file, "rb") as f:
        files = {"file": (test_file.name, f, "audio/wav")}
        response = requests.post(f"{BASE_URL}/api/audio/process", files=files)
    
    if response.status_code != 200:
        print(f"   Error: {response.json()}")
        return
    
    result = response.json()
    job_id = result["job_id"]
    print(f"   Job ID: {job_id}")
    print(f"   Status: {result['status']}")
    print(f"   Message: {result['message']}")
    
    # 3. Monitor job progress
    print("\n3. Monitoring job progress...")
    while True:
        response = requests.get(f"{BASE_URL}/api/jobs/{job_id}")
        job_status = response.json()
        
        print(f"   Status: {job_status['status']} - Progress: {job_status['progress']}% - {job_status['message']}")
        
        if job_status["status"] in ["completed", "failed", "cancelled"]:
            break
        
        time.sleep(2)
    
    if job_status["status"] != "completed":
        print(f"\n   Job failed: {job_status.get('error', 'Unknown error')}")
        return
    
    # 4. List available stems
    print("\n4. Available stems:")
    response = requests.get(f"{BASE_URL}/api/audio/stems/{job_id}")
    stems = response.json()
    
    for stem in stems:
        size_mb = stem["size"] / 1024 / 1024
        print(f"   - {stem['name']}: {stem['filename']} ({size_mb:.2f} MB)")
    
    # 5. Download URLs
    print("\n5. Download URLs:")
    for stem in stems:
        download_url = f"{BASE_URL}/api/audio/download/{job_id}/{stem['name']}"
        print(f"   - {stem['name']}: {download_url}")
    
    print("\n✅ Test completed successfully!")
    print(f"\nTo download a stem, use:")
    print(f"   curl -O -J '{BASE_URL}/api/audio/download/{job_id}/vocals'")

if __name__ == "__main__":
    test_api() 