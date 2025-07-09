"""
Job manager for tracking processing jobs
"""
from datetime import datetime
from typing import Dict, List, Optional
import threading

from app.models.audio import ProcessingStatus

class JobManager:
    """
    Simple in-memory job manager.
    In production, this should be replaced with a proper database.
    """
    
    def __init__(self):
        self._jobs: Dict[str, Dict] = {}
        self._lock = threading.Lock()
    
    def create_job(
        self,
        job_id: str,
        filename: str,
        file_path: str,
        model: str
    ) -> Dict:
        """Create a new job"""
        with self._lock:
            job = {
                "job_id": job_id,
                "filename": filename,
                "file_path": file_path,
                "model": model,
                "status": ProcessingStatus.PENDING,
                "progress": 0,
                "message": "Job created",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "completed_at": None,
                "error": None,
                "output_dir": None
            }
            self._jobs[job_id] = job
            return job
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Get job by ID"""
        with self._lock:
            return self._jobs.get(job_id)
    
    def update_job(self, job_id: str, **kwargs) -> Optional[Dict]:
        """Update job properties"""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            
            # Update fields
            for key, value in kwargs.items():
                job[key] = value
            
            # Update timestamp
            job["updated_at"] = datetime.utcnow()
            
            # Set completed_at if status is terminal
            if kwargs.get("status") in [
                ProcessingStatus.COMPLETED,
                ProcessingStatus.FAILED,
                ProcessingStatus.CANCELLED
            ]:
                job["completed_at"] = datetime.utcnow()
            
            return job
    
    def delete_job(self, job_id: str) -> bool:
        """Delete a job"""
        with self._lock:
            if job_id in self._jobs:
                del self._jobs[job_id]
                return True
            return False
    
    def list_jobs(self, status: Optional[str] = None) -> List[Dict]:
        """List all jobs, optionally filtered by status"""
        with self._lock:
            jobs = list(self._jobs.values())
            
            if status:
                jobs = [j for j in jobs if j["status"] == status]
            
            # Sort by created_at descending
            jobs.sort(key=lambda j: j["created_at"], reverse=True)
            
            return jobs
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Remove jobs older than specified hours"""
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        with self._lock:
            to_delete = []
            for job_id, job in self._jobs.items():
                if job["created_at"] < cutoff:
                    to_delete.append(job_id)
            
            for job_id in to_delete:
                del self._jobs[job_id]
            
            return len(to_delete)

# Global job manager instance
job_manager = JobManager() 