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

@router.post("/process", response_model=ProcessingResponse)
async def process_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model: str = "htdemucs"
):
    """
    Upload an audio file for stem separation processing.
    
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

@router.get("/stems/{job_id}", response_model=List[StemInfo])
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
        stems.append(StemInfo(
            name=stem_name,
            filename=stem_file.name,
            size=stem_file.stat().st_size
        ))
    
    return stems

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
    
    return FileResponse(
        path=stem_file,
        media_type="audio/wav",
        filename=f"{Path(job['filename']).stem}_{stem_name}.wav"
    )

@router.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete files
    if job.get("file_path") and Path(job["file_path"]).exists():
        Path(job["file_path"]).unlink()
    
    if job.get("output_dir") and Path(job["output_dir"]).exists():
        import shutil
        shutil.rmtree(job["output_dir"])
    
    # Remove job from manager
    job_manager.delete_job(job_id)
    
    return {"message": "Job deleted successfully"} 