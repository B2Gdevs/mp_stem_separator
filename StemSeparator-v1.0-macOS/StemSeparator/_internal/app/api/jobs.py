"""
Job management endpoints
"""
from typing import List
from fastapi import APIRouter, HTTPException

from app.services.job_manager import job_manager
from app.models.audio import JobInfo, JobStatus

router = APIRouter()

@router.get("/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a processing job.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatus(
        job_id=job["job_id"],
        status=job["status"],
        progress=job.get("progress", 0),
        message=job.get("message", ""),
        filename=job["filename"],
        created_at=job["created_at"],
        updated_at=job.get("updated_at"),
        completed_at=job.get("completed_at"),
        error=job.get("error")
    )

@router.get("/", response_model=List[JobInfo])
async def list_jobs(
    status: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    List all jobs with optional filtering by status.
    
    - **status**: Filter by job status (pending, processing, completed, failed)
    - **limit**: Maximum number of jobs to return
    - **offset**: Number of jobs to skip
    """
    jobs = job_manager.list_jobs(status=status)
    
    # Apply pagination
    paginated_jobs = jobs[offset:offset + limit]
    
    return [
        JobInfo(
            job_id=job["job_id"],
            filename=job["filename"],
            status=job["status"],
            created_at=job["created_at"],
            updated_at=job.get("updated_at")
        )
        for job in paginated_jobs
    ]

@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str):
    """
    Cancel a pending or processing job.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] not in ["pending", "processing"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job with status: {job['status']}"
        )
    
    job_manager.update_job(job_id, status="cancelled", message="Job cancelled by user")
    
    return {"message": "Job cancelled successfully"} 