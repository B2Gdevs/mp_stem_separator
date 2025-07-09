"""
Database models for SQLAlchemy
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Enum as SQLEnum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.audio import ProcessingStatus

class Job(Base):
    """Job database model"""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(36), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    model = Column(String(50), nullable=False, default="htdemucs")
    status = Column(SQLEnum(ProcessingStatus), nullable=False, default=ProcessingStatus.PENDING)
    progress = Column(Float, nullable=False, default=0.0)
    message = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    output_dir = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    stems = relationship("Stem", back_populates="job", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "job_id": self.job_id,
            "filename": self.filename,
            "file_path": self.file_path,
            "model": self.model,
            "status": self.status.value if self.status else "pending",
            "progress": self.progress,
            "message": self.message,
            "error": self.error,
            "output_dir": self.output_dir,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }

class Stem(Base):
    """Stem file database model"""
    __tablename__ = "stems"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id_fk = Column(String(36), ForeignKey("jobs.job_id"), nullable=False)
    name = Column(String(100), nullable=False)  # vocals, drums, bass, other
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", back_populates="stems")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "name": self.name,
            "filename": self.filename,
            "size": self.file_size,
        } 