"""
Pydantic models for audio processing
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class ProcessingStatus(str, Enum):
    """Job processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ProcessingResponse(BaseModel):
    """Response after submitting audio for processing"""
    job_id: str
    status: ProcessingStatus
    message: str
    filename: str

class StemInfo(BaseModel):
    """Information about a stem file"""
    name: str
    filename: str
    size: int  # File size in bytes

class JobInfo(BaseModel):
    """Basic job information"""
    job_id: str
    filename: str
    status: ProcessingStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

class JobStatus(BaseModel):
    """Detailed job status"""
    job_id: str
    status: ProcessingStatus
    progress: float  # 0-100
    message: str
    filename: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None 