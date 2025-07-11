import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadAudio } from '@/hooks/useAudioHooks';

interface FileUploadProps {
  onUploadSuccess: (jobId: string, filename: string) => void;
}

const ALLOWED_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/flac',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  '.wav',
  '.mp3',
  '.flac',
  '.ogg',
  '.m4a',
  '.aac'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uploadAudioMutation = useUploadAudio();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check file type
    const isValidType = ALLOWED_TYPES.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );
    
    if (!isValidType) {
      return 'Unsupported file type. Please use WAV, MP3, FLAC, OGG, M4A, or AAC files.';
    }

    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const result = await uploadAudioMutation.mutateAsync({ file });
      onUploadSuccess(result.job_id, result.filename);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file. Please try again.');
    }
  }, [uploadAudioMutation, onUploadSuccess]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleButtonClick = () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    input?.click();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
        isDragOver
          ? 'border-primary bg-primary/5'
          : error
          ? 'border-destructive bg-destructive/5'
          : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id="file-input"
        type="file"
        accept={ALLOWED_TYPES.filter(type => type.startsWith('.')).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        {uploadAudioMutation.isPending ? (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <p className="text-lg mb-4">Uploading...</p>
            <p className="text-sm text-muted-foreground">Please wait while your file is being uploaded</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg mb-4 text-destructive">Upload Error</p>
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              Try Again
            </Button>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-4">Drop your audio file here</p>
            <Button onClick={handleButtonClick}>
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Supports WAV, MP3, FLAC, OGG, M4A • Max 500MB
            </p>
          </>
        )}
      </div>
    </div>
  );
} 