
"""
Audio processing service using Demucs
"""
import subprocess
import sys
import re
import threading
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.services.job_manager import job_manager
from app.models.audio import ProcessingStatus

class AudioProcessor:
    """Handles audio stem separation using Demucs"""
    
    def __init__(self):
        self.python = sys.executable
    
    def _parse_progress(self, line: str) -> Optional[float]:
        """Parse progress from demucs stderr output"""
        # Look for patterns like "  5%|███▋                                                     | 11.7/234.0 [00:04<01:15,  2.96seconds/s]"
        progress_match = re.search(r'(\d+)%\|', line)
        if progress_match:
            return float(progress_match.group(1))
        return None
    
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
                progress=0
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
                progress=5,
                message="Running stem separation..."
            )
            
            # Run demucs with real-time progress monitoring
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Monitor progress in real-time
            last_progress = 5
            while True:
                stderr_line = process.stderr.readline()
                if stderr_line == '' and process.poll() is not None:
                    break
                    
                if stderr_line:
                    # Parse progress from stderr
                    progress = self._parse_progress(stderr_line.strip())
                    if progress is not None and progress > last_progress:
                        last_progress = progress
                        job_manager.update_job(
                            job_id,
                            progress=min(95, progress),  # Cap at 95% until completion
                            message=f"Processing stems... {progress:.0f}%"
                        )
            
            # Get final output
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Demucs failed: {stderr}")
            
            # Update progress to 98% for file organization
            job_manager.update_job(
                job_id,
                progress=98,
                message="Organizing output files..."
            )
            
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

# Global audio processor instance
audio_processor = AudioProcessor() 