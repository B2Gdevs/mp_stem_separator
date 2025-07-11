
"""
Audio processing service using Demucs
"""
import subprocess
import sys
import re
import threading
import asyncio
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from app.core.config import settings
from app.services.db_job_service import db_job_service
from app.models.audio import ProcessingStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LogCapture:
    """Captures and stores logs for streaming"""
    def __init__(self):
        self._logs = {}  # job_id -> list of log entries
        self._log_lock = threading.Lock()  # Thread safety for concurrent access
        
    def add_log(self, job_id: str, level: str, message: str):
        """Add a log entry for a job"""
        with self._log_lock:
            if job_id not in self._logs:
                self._logs[job_id] = []
                
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'level': level,
                'message': message
            }
            self._logs[job_id].append(log_entry)
            
            # Keep only last 1000 log entries per job
            if len(self._logs[job_id]) > 1000:
                self._logs[job_id] = self._logs[job_id][-1000:]
                
        # Log to console as well and flush immediately
        print(f"[LOG_CAPTURE] [{job_id}] {level}: {message}", flush=True)
        logger.info(f"[{job_id}] {level}: {message}")
        
    def get_logs(self, job_id: str) -> List[dict]:
        """Get all logs for a job"""
        with self._log_lock:
            return self._logs.get(job_id, []).copy()  # Return a copy to avoid race conditions
        
    def clear_logs(self, job_id: str):
        """Clear logs for a job"""
        with self._log_lock:
            if job_id in self._logs:
                del self._logs[job_id]

# Global log capture instance
log_capture = LogCapture()

class AudioProcessor:
    """Handles audio stem separation using Demucs"""
    
    def __init__(self):
        self.python = sys.executable
        self.log_capture = log_capture
    
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
            self.log_capture.add_log(job_id, "INFO", f"Starting audio processing for {file_path.name}")
            self.log_capture.add_log(job_id, "INFO", f"Using model: {model}")
            self.log_capture.add_log(job_id, "INFO", f"Python executable: {self.python}")
            
            # Update job status
            await db_job_service.update_job(
                job_id,
                status=ProcessingStatus.PROCESSING,
                message="Starting audio processing...",
                progress=0
            )
            
            # Prepare output directory
            output_dir = settings.output_dir / job_id
            output_dir.mkdir(parents=True, exist_ok=True)
            self.log_capture.add_log(job_id, "INFO", f"Created output directory: {output_dir}")
            
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
                self.log_capture.add_log(job_id, "INFO", f"Using device: {settings.device}")
            
            self.log_capture.add_log(job_id, "INFO", f"Running command: {' '.join(cmd)}")
            
            # Check if demucs is available
            try:
                import demucs
                self.log_capture.add_log(job_id, "INFO", f"Demucs version: {demucs.__version__}")
            except ImportError as e:
                self.log_capture.add_log(job_id, "ERROR", f"Demucs import failed: {e}")
                raise Exception(f"Demucs not available: {e}")
            
            # Update progress
            await db_job_service.update_job(
                job_id,
                progress=5,
                message="Running stem separation..."
            )
            
            self.log_capture.add_log(job_id, "INFO", "Starting demucs process...")
            
            # Run demucs with real-time progress monitoring using asyncio subprocess
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                stdin=asyncio.subprocess.PIPE
            )
            
            self.log_capture.add_log(job_id, "INFO", f"Process started with PID: {process.pid}")
            
            # Monitor progress in real-time with non-blocking reads
            last_progress = 5
            stderr_lines = []
            stdout_lines = []
            
            async def read_stderr():
                """Read stderr lines and process them"""
                nonlocal last_progress
                while True:
                    try:
                        line_bytes = await process.stderr.readline()
                        if not line_bytes:
                            break
                        line = line_bytes.decode('utf-8').strip()
                        if line:
                            stderr_lines.append(line)
                            self.log_capture.add_log(job_id, "STDERR", line)
                        
                            # Parse progress from stderr
                            progress = self._parse_progress(line)
                            if progress is not None and progress > last_progress:
                                last_progress = progress
                                await db_job_service.update_job(
                                    job_id,
                                    progress=min(95, progress),  # Cap at 95% until completion
                                    message=f"Processing stems... {progress:.0f}%"
                                )
                                self.log_capture.add_log(job_id, "PROGRESS", f"Progress: {progress:.0f}%")
                    except Exception as e:
                        self.log_capture.add_log(job_id, "ERROR", f"Error reading stderr: {e}")
                        break
            
            async def read_stdout():
                """Read stdout lines and process them"""
                while True:
                    try:
                        line_bytes = await process.stdout.readline()
                        if not line_bytes:
                            break
                        line = line_bytes.decode('utf-8').strip()
                        if line:
                            stdout_lines.append(line)
                            self.log_capture.add_log(job_id, "STDOUT", line)
                    except Exception as e:
                        self.log_capture.add_log(job_id, "ERROR", f"Error reading stdout: {e}")
                        break
            
            # Run both readers concurrently
            await asyncio.gather(
                read_stderr(),
                read_stdout(),
                process.wait()
            )
            
            # Get final return code
            return_code = process.returncode
            stdout = b''.join([line.encode() + b'\n' for line in stdout_lines]).decode()
            stderr = b''.join([line.encode() + b'\n' for line in stderr_lines]).decode()
            
            if stdout:
                for line in stdout.split('\n'):
                    if line.strip():
                        self.log_capture.add_log(job_id, "STDOUT", line.strip())
            
            if stderr:
                for line in stderr.split('\n'):
                    if line.strip():
                        self.log_capture.add_log(job_id, "STDERR", line.strip())
            
            self.log_capture.add_log(job_id, "INFO", f"Process completed with return code: {return_code}")
            
            if return_code != 0:
                error_msg = f"Demucs failed with return code {return_code}"
                if stderr:
                    error_msg += f": {stderr}"
                self.log_capture.add_log(job_id, "ERROR", error_msg)
                raise Exception(error_msg)
            
            # Update progress to 98% for file organization
            await db_job_service.update_job(
                job_id,
                progress=98,
                message="Organizing output files..."
            )
            
            self.log_capture.add_log(job_id, "INFO", "Looking for output files...")
            
            # Find output directory (demucs creates nested subdirectories)
            # Structure: output_dir/model_name/filename_without_extension/
            stem_dir = None
            model_dir = output_dir / model
            self.log_capture.add_log(job_id, "INFO", f"Checking model directory: {model_dir}")
            
            if model_dir.exists():
                self.log_capture.add_log(job_id, "INFO", f"Model directory exists, listing contents:")
                for item in model_dir.iterdir():
                    self.log_capture.add_log(job_id, "INFO", f"  Found: {item} ({'dir' if item.is_dir() else 'file'})")
                    if item.is_dir():
                        stem_dir = item
                        break
            else:
                self.log_capture.add_log(job_id, "ERROR", f"Model directory does not exist: {model_dir}")
            
            if not stem_dir:
                # List what's actually in the output directory
                self.log_capture.add_log(job_id, "ERROR", f"No stem directory found. Output directory contents:")
                for item in output_dir.rglob("*"):
                    self.log_capture.add_log(job_id, "ERROR", f"  {item} ({'dir' if item.is_dir() else 'file'})")
                raise Exception("No output directory found")
            
            self.log_capture.add_log(job_id, "INFO", f"Found stem directory: {stem_dir}")
            
            # Create stem records in database
            stems_data = []
            for stem_file in stem_dir.glob("*.wav"):
                self.log_capture.add_log(job_id, "INFO", f"Found stem file: {stem_file}")
                stems_data.append({
                    'name': stem_file.stem,
                    'filename': stem_file.name,
                    'file_path': str(stem_file),
                    'file_size': stem_file.stat().st_size
                })
            
            self.log_capture.add_log(job_id, "INFO", f"Total stems found: {len(stems_data)}")
            
            # Save stems to database
            if stems_data:
                await db_job_service.create_stems(job_id, stems_data)
                self.log_capture.add_log(job_id, "INFO", "Stems saved to database")
            else:
                self.log_capture.add_log(job_id, "WARNING", "No stem files found to save")
            
            # Update job with completion
            await db_job_service.update_job(
                job_id,
                status=ProcessingStatus.COMPLETED,
                progress=100,
                message="Processing completed successfully",
                output_dir=str(stem_dir)
            )
            
            self.log_capture.add_log(job_id, "INFO", "Processing completed successfully")
            
            # Clean up temp file
            if file_path.exists():
                file_path.unlink()
                self.log_capture.add_log(job_id, "INFO", f"Cleaned up temp file: {file_path}")
                
        except Exception as e:
            error_msg = str(e)
            self.log_capture.add_log(job_id, "ERROR", f"Processing failed: {error_msg}")
            
            # Update job with error
            await db_job_service.update_job(
                job_id,
                status=ProcessingStatus.FAILED,
                error=error_msg,
                message=f"Processing failed: {error_msg}"
            )
            
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
                self.log_capture.add_log(job_id, "INFO", f"Cleaned up temp file after error: {file_path}")
            
            raise e

# Global audio processor instance
audio_processor = AudioProcessor() 