"""
Audio processing service using Demucs
"""
import subprocess
import sys
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.services.job_manager import job_manager
from app.models.audio import ProcessingStatus

class AudioProcessor:
    """Handles audio stem separation using Demucs"""
    
    def __init__(self):
        self.python = sys.executable
    
    async def process_file(
        self,
        job_id: str,
        file_path: Path,
        model: str = "htdemucs"
    ) -> None:
        """
        Process an audio file using Demucs.
        
        Args:
            job_id: Unique job identifier
            file_path: Path to the audio file
            model: Demucs model to use
        """
        try:
            # Update job status
            job_manager.update_job(
                job_id,
                status=ProcessingStatus.PROCESSING,
                message="Starting audio processing...",
                progress=10
            )
            
            # Prepare output directory
            output_dir = settings.output_dir / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Build demucs command
            cmd = [
                self.python, "-m", "demucs",
                "-n", model,
                "-o", str(output_dir),
                str(file_path)
            ]
            
            # Add device option if specified
            if settings.device:
                cmd.extend(["-d", settings.device])
            
            # Update progress
            job_manager.update_job(
                job_id,
                progress=20,
                message="Running stem separation..."
            )
            
            # Run demucs
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Monitor progress (simplified - in production, parse output for real progress)
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Demucs failed: {stderr}")
            
            # Find output directory (demucs creates nested subdirectories)
            # Structure: output_dir/model_name/filename_without_extension/
            stem_dir = None
            model_dir = output_dir / model
            if model_dir.exists():
                for subdir in model_dir.iterdir():
                    if subdir.is_dir():
                        stem_dir = subdir
                        break
            
            if not stem_dir:
                raise Exception("No output directory found")
            
            # Update job with completion
            job_manager.update_job(
                job_id,
                status=ProcessingStatus.COMPLETED,
                progress=100,
                message="Processing completed successfully",
                output_dir=str(stem_dir)
            )
            
            # Clean up temp file
            if file_path.exists():
                file_path.unlink()
                
        except Exception as e:
            # Update job with error
            job_manager.update_job(
                job_id,
                status=ProcessingStatus.FAILED,
                error=str(e),
                message=f"Processing failed: {str(e)}"
            )
            
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
            
            raise e 