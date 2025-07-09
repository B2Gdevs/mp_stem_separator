"""
Database-backed job service for persistent storage
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, func
from sqlalchemy.orm import selectinload

from app.models.db_models import Job, Stem
from app.models.audio import ProcessingStatus
from app.core.database import AsyncSessionLocal

class DatabaseJobService:
    """Database-backed job management service"""
    
    async def create_job(
        self,
        job_id: str,
        filename: str,
        file_path: str,
        model: str
    ) -> Dict[str, Any]:
        """Create a new job"""
        async with AsyncSessionLocal() as session:
            db_job = Job(
                job_id=job_id,
                filename=filename,
                file_path=file_path,
                model=model,
                status=ProcessingStatus.PENDING,
                progress=0.0,
                message="Job created",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(db_job)
            await session.commit()
            await session.refresh(db_job)
            
            return db_job.to_dict()
    
    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Job).where(Job.job_id == job_id)
            )
            job = result.scalar_one_or_none()
            
            if job:
                return job.to_dict()
            return None
    
    async def update_job(self, job_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Update job properties"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Job).where(Job.job_id == job_id)
            )
            job = result.scalar_one_or_none()
            
            if not job:
                return None
            
            # Update fields
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            
            # Update timestamp
            job.updated_at = datetime.utcnow()
            
            # Set completed_at if status is terminal
            if kwargs.get("status") in [
                ProcessingStatus.COMPLETED,
                ProcessingStatus.FAILED,
                ProcessingStatus.CANCELLED
            ]:
                job.completed_at = datetime.utcnow()
            
            await session.commit()
            await session.refresh(job)
            
            return job.to_dict()
    
    async def delete_job(self, job_id: str) -> bool:
        """Delete a job and its stems"""
        async with AsyncSessionLocal() as session:
            # Delete job (stems will be deleted via cascade)
            result = await session.execute(
                delete(Job).where(Job.job_id == job_id)
            )
            await session.commit()
            
            return result.rowcount > 0
    
    async def list_jobs(
        self,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List all jobs, optionally filtered by status"""
        async with AsyncSessionLocal() as session:
            query = select(Job)
            
            if status:
                query = query.where(Job.status == status)
            
            # Order by created_at descending
            query = query.order_by(Job.created_at.desc())
            
            # Apply pagination
            query = query.offset(offset).limit(limit)
            
            result = await session.execute(query)
            jobs = result.scalars().all()
            
            return [job.to_dict() for job in jobs]
    
    async def get_job_stats(self) -> Dict[str, int]:
        """Get job statistics"""
        async with AsyncSessionLocal() as session:
            # Count jobs by status
            stats = {}
            
            for status in ProcessingStatus:
                result = await session.execute(
                    select(func.count(Job.id)).where(Job.status == status)
                )
                stats[status.value] = result.scalar() or 0
            
            # Total count
            result = await session.execute(select(func.count(Job.id)))
            stats['total'] = result.scalar() or 0
            
            return stats
    
    async def create_stems(self, job_id: str, stems_data: List[Dict[str, Any]]):
        """Create stem records for a completed job"""
        async with AsyncSessionLocal() as session:
            stems = []
            for stem_data in stems_data:
                stem = Stem(
                    job_id_fk=job_id,
                    name=stem_data['name'],
                    filename=stem_data['filename'],
                    file_path=stem_data['file_path'],
                    file_size=stem_data['file_size'],
                    created_at=datetime.utcnow()
                )
                stems.append(stem)
            
            session.add_all(stems)
            await session.commit()
    
    async def get_stems(self, job_id: str) -> List[Dict[str, Any]]:
        """Get stems for a job"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Stem).where(Stem.job_id_fk == job_id)
            )
            stems = result.scalars().all()
            
            return [stem.to_dict() for stem in stems]
    
    async def cleanup_old_jobs(self, max_age_hours: int = 24) -> int:
        """Remove jobs older than specified hours"""
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                delete(Job).where(Job.created_at < cutoff)
            )
            await session.commit()
            
            return result.rowcount

# Global database job service instance
db_job_service = DatabaseJobService() 