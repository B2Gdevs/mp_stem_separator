"""
Application configuration settings
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    api_title: str = "Stem Separator API"
    api_version: str = "0.1.0"
    
    # File Settings
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    allowed_extensions: list[str] = [".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac"]
    
    # Processing Settings
    output_dir: Path = Path("separated")
    temp_dir: Path = Path("temp")
    demucs_model: str = "htdemucs"  # Default model
    device: Optional[str] = None  # None for auto-detect, "cpu" or "cuda"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # Job Settings
    job_timeout: int = 3600  # 1 hour
    max_concurrent_jobs: int = 2
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)

# Create settings instance
settings = Settings() 