"""
Audio processing endpoints
"""
import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.audio_processor import AudioProcessor
from app.services.job_manager import job_manager
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
        job = job_manager.create_job(
            job_id=job_id,
            filename=file.filename,
            file_path=str(temp_path),
            model=model
        )
        
        # Update job status to uploaded
        job_manager.update_job(
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
    job = job_manager.get_job(job_id)
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
    job_manager.update_job(
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
        job = job_manager.create_job(
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
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job['status']}"
        )
    
    output_dir = Path(job["output_dir"])
    if not output_dir.exists():
        raise HTTPException(status_code=404, detail="Output directory not found")
    
    stems = []
    for stem_file in output_dir.glob("*.wav"):
        stem_name = stem_file.stem
        stems.append({
            "name": stem_name,
            "filename": stem_file.name,
            "size": stem_file.stat().st_size
        })
    
    return {"stems": stems}

@router.get("/download/{job_id}/{stem_name}")
async def download_stem(job_id: str, stem_name: str):
    """
    Download a specific stem file.
    
    - **job_id**: The job ID from processing
    - **stem_name**: Name of the stem (vocals, drums, bass, other)
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job['status']}"
        )
    
    # Construct file path
    output_dir = Path(job["output_dir"])
    stem_file = output_dir / f"{stem_name}.wav"
    
    if not stem_file.exists():
        raise HTTPException(status_code=404, detail=f"Stem '{stem_name}' not found")
    
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
    job = job_manager.get_job(job_id)
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
    
    # Delete job
    job_manager.delete_job(job_id)
    
    return {"message": "Job deleted successfully"} 