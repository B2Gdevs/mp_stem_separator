"""
Audio processing endpoints
"""
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse

from app.core.config import settings
from app.services.audio_processor import AudioProcessor, log_capture
from app.services.db_job_service import db_job_service
from app.models.audio import (
    ProcessingResponse,
    StemInfo,
    ProcessingStatus,
)

router = APIRouter()
audio_processor = AudioProcessor()

@router.post("/upload", response_model=ProcessingResponse)
async def upload_audio(
    file: UploadFile = File(...),
    model: str = "htdemucs"
):
    """
    Upload an audio file for processing (does not start processing).
    
    - **file**: Audio file to upload (WAV, MP3, FLAC, OGG, M4A, AAC)
    - **model**: Demucs model to use (default: htdemucs)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024}MB"
        )
    
    # Generate job ID and save file
    job_id = str(uuid.uuid4())
    temp_path = settings.temp_dir / f"{job_id}{file_ext}"
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create job with uploaded status
        job = await db_job_service.create_job(
            job_id=job_id,
            filename=file.filename,
            file_path=str(temp_path),
            model=model
        )
        
        # Update job status to uploaded
        await db_job_service.update_job(
            job_id,
            status=ProcessingStatus.PENDING,
            message="File uploaded successfully. Ready to process.",
            progress=0
        )
        
        return ProcessingResponse(
            job_id=job_id,
            status=ProcessingStatus.PENDING,
            message="File uploaded successfully. Ready to process.",
            filename=file.filename
        )
        
    except Exception as e:
        # Clean up on error
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{job_id}", response_model=ProcessingResponse)
async def start_processing(
    job_id: str,
    background_tasks: BackgroundTasks,
):
    """
    Start processing an uploaded audio file.
    
    - **job_id**: The job ID from upload
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != ProcessingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Job cannot be processed. Current status: {job['status']}"
        )
    
    file_path = Path(job["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    
    # Start processing in background
    background_tasks.add_task(
        audio_processor.process_file,
        job_id=job_id,
        file_path=file_path,
        model=job["model"]
    )
    
    # Update job status to processing
    await db_job_service.update_job(
        job_id,
        status=ProcessingStatus.PROCESSING,
        message="Processing started...",
        progress=5
    )
    
    return ProcessingResponse(
        job_id=job_id,
        status=ProcessingStatus.PROCESSING,
        message="Processing started...",
        filename=job["filename"]
    )

@router.post("/process", response_model=ProcessingResponse)
async def process_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model: str = "htdemucs"
):
    """
    Upload an audio file for stem separation processing (legacy endpoint).
    
    - **file**: Audio file to process (WAV, MP3, FLAC, OGG, M4A, AAC)
    - **model**: Demucs model to use (default: htdemucs)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not supported. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024}MB"
        )
    
    # Generate job ID and save file
    job_id = str(uuid.uuid4())
    temp_path = settings.temp_dir / f"{job_id}{file_ext}"
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create job
        job = await db_job_service.create_job(
            job_id=job_id,
            filename=file.filename,
            file_path=str(temp_path),
            model=model
        )
        
        # Process in background
        background_tasks.add_task(
            audio_processor.process_file,
            job_id=job_id,
            file_path=temp_path,
            model=model
        )
        
        return ProcessingResponse(
            job_id=job_id,
            status=ProcessingStatus.PENDING,
            message="File uploaded successfully. Processing started.",
            filename=file.filename
        )
        
    except Exception as e:
        # Clean up on error
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stems/{job_id}")
async def list_stems(job_id: str):
    """
    List available stems for a completed job.
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job['status']}"
        )
    
    # Get stems from database
    stems = await db_job_service.get_stems(job_id)
    
    return {"stems": stems}

@router.get("/download/{job_id}/{stem_name}")
async def download_stem(job_id: str, stem_name: str):
    """
    Download a specific stem file.
    
    - **job_id**: The job ID from processing
    - **stem_name**: Name of the stem (vocals, drums, bass, other)
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job['status']}"
        )
    
    # Get stems from database to find the file path
    stems = await db_job_service.get_stems(job_id)
    stem_info = next((s for s in stems if s['name'] == stem_name), None)
    
    if not stem_info:
        raise HTTPException(status_code=404, detail=f"Stem '{stem_name}' not found")
    
    # Use the file path from the database or fallback to constructed path
    stem_file = Path(stem_info.get('file_path')) if 'file_path' in stem_info else None
    
    # Fallback to constructed path if file_path not available
    if not stem_file or not stem_file.exists():
        output_dir = Path(job["output_dir"])
        stem_file = output_dir / f"{stem_name}.wav"
    
    if not stem_file.exists():
        raise HTTPException(status_code=404, detail=f"Stem file '{stem_name}' not found")
    
    # Create proper filename: original_filename_stem.wav
    original_filename = Path(job["filename"]).stem  # Remove extension
    download_filename = f"{original_filename}_{stem_name}.wav"
    
    return FileResponse(
        path=stem_file,
        media_type="audio/wav",
        filename=download_filename,
        headers={
            "Content-Disposition": f"attachment; filename={download_filename}"
        }
    )

@router.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and clean up files.
    
    - **job_id**: The job ID to delete
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Clean up files
    file_path = Path(job["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    if job.get("output_dir"):
        output_dir = Path(job["output_dir"])
        if output_dir.exists():
            import shutil
            shutil.rmtree(output_dir)
    
    # Delete job from database
    success = await db_job_service.delete_job(job_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": "Job deleted successfully"}

@router.get("/logs/{job_id}")
async def get_job_logs(job_id: str):
    """
    Get all logs for a specific job.
    
    - **job_id**: The job ID to get logs for
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    logs = log_capture.get_logs(job_id)
    return {
        "job_id": job_id,
        "logs": logs,
        "total_logs": len(logs)
    }

@router.delete("/logs/{job_id}")
async def clear_job_logs(job_id: str):
    """
    Clear logs for a specific job.
    
    - **job_id**: The job ID to clear logs for
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    log_capture.clear_logs(job_id)
    return {"message": f"Logs cleared for job {job_id}"}

@router.get("/logs/{job_id}/latest")
async def get_latest_logs(job_id: str, limit: int = 50):
    """
    Get the latest logs for a specific job.
    
    - **job_id**: The job ID to get logs for
    - **limit**: Number of latest log entries to return (default: 50)
    """
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    all_logs = log_capture.get_logs(job_id)
    latest_logs = all_logs[-limit:] if len(all_logs) > limit else all_logs
    
    return {
        "job_id": job_id,
        "logs": latest_logs,
        "total_logs": len(all_logs),
        "showing": len(latest_logs)
    }

@router.get("/logs/{job_id}/stream")
async def stream_job_logs(job_id: str):
    """
    Stream logs for a specific job using Server-Sent Events (SSE).
    
    - **job_id**: The job ID to stream logs for
    """
    import asyncio
    import json
    from datetime import datetime
    
    job = await db_job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    async def log_generator():
        last_log_count = 0
        max_iterations = 600  # 5 minutes max (600 * 0.5 seconds)
        iteration = 0
        
        # Send initial connection confirmation
        yield {
            "event": "connected",
            "data": json.dumps({"job_id": job_id, "message": "Log stream connected"})
        }
        
        while iteration < max_iterations:
            try:
                # Get current logs
                current_logs = log_capture.get_logs(job_id)
                
                # Send new logs since last check
                if len(current_logs) > last_log_count:
                    new_logs = current_logs[last_log_count:]
                    for log_entry in new_logs:
                        yield {
                            "event": "log",
                            "data": json.dumps(log_entry)
                        }
                    last_log_count = len(current_logs)
                
                # Check if job is complete
                job_status = await db_job_service.get_job(job_id)
                if job_status and job_status.get("status") in ["completed", "failed"]:
                    # Send final status and stop streaming
                    yield {
                        "event": "status",
                        "data": json.dumps({"status": job_status.get("status"), "message": "Job completed"})
                    }
                    break
                
                # Send heartbeat every 10 iterations (5 seconds)
                if iteration % 10 == 0:
                    yield {
                        "event": "heartbeat",
                        "data": json.dumps({"timestamp": datetime.now().isoformat(), "logs_count": len(current_logs)})
                    }
                
                # Wait before next check - more frequent for active processing
                await asyncio.sleep(0.2)  # Check 5 times per second for immediate updates
                iteration += 1
                
            except Exception as e:
                yield {
                    "event": "error", 
                    "data": json.dumps({"error": str(e)})
                }
                break
    
    return EventSourceResponse(log_generator()) 