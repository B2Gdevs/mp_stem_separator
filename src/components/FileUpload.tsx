'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, Music, Waveform } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUploadAudio, useStartProcessing } from '@/hooks/useAudioHooks';
import { toast } from 'sonner';

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

export function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('htdemucs');
  const [uploadedJob, setUploadedJob] = useState<{ job_id: string; filename: string } | null>(null);
  
  const uploadAudioMutation = useUploadAudio();
  const startProcessingMutation = useStartProcessing();

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
      const result = await uploadAudioMutation.mutateAsync({ file, model: selectedModel });
      setUploadedJob(result);
      toast.success(`File uploaded successfully: ${result.filename}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to upload file. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [uploadAudioMutation, selectedModel]);

  const handleStartProcessing = async () => {
    if (!uploadedJob) return;
    
    try {
      await startProcessingMutation.mutateAsync(uploadedJob.job_id);
      setUploadedJob(null);
      toast.success('Processing started! Check the Processing tab for updates.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to start processing.';
      toast.error(errorMessage);
    }
  };

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
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">AI Model</label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="glass-dark border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-dark border-white/10">
            <SelectItem value="htdemucs">HTDemucs (High Quality)</SelectItem>
            <SelectItem value="mdx_extra">MDX Extra (Fast)</SelectItem>
            <SelectItem value="mdx">MDX (Balanced)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upload Area */}
      <motion.div
        className={`border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 glow-effect'
            : error
            ? 'border-red-400 bg-red-500/10'
            : uploadedJob
            ? 'border-green-400 bg-green-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Waveform className="h-16 w-16 mx-auto text-indigo-400" />
              </motion.div>
              <p className="text-xl font-semibold text-white">Uploading...</p>
              <p className="text-gray-400">Preparing your audio file for processing</p>
            </motion.div>
          ) : uploadedJob ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <CheckCircle className="h-16 w-16 mx-auto text-green-400" />
              <p className="text-xl font-semibold text-white">Ready to Process</p>
              <p className="text-gray-400">File: {uploadedJob.filename}</p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleStartProcessing}
                  disabled={startProcessingMutation.isPending}
                  className="gradient-primary text-white border-0"
                >
                  {startProcessingMutation.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Waveform className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Music className="mr-2 h-4 w-4" />
                  )}
                  Start Processing
                </Button>
                <Button 
                  onClick={() => setUploadedJob(null)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Upload Different File
                </Button>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <AlertCircle className="h-16 w-16 mx-auto text-red-400" />
              <p className="text-xl font-semibold text-white">Upload Error</p>
              <p className="text-red-400">{error}</p>
              <Button 
                onClick={() => setError(null)} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Try Again
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              </motion.div>
              <p className="text-xl font-semibold text-white">Drop your audio file here</p>
              <p className="text-gray-400">or click to browse files</p>
              <Button 
                onClick={handleButtonClick}
                className="gradient-primary text-white border-0"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                Choose Audio File
              </Button>
              <div className="text-sm text-gray-400 mt-4 space-y-1">
                <p>Supports: WAV, MP3, FLAC, OGG, M4A, AAC</p>
                <p>Maximum file size: 500MB</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Processing Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="glass-dark rounded-lg p-4 border border-white/10">
          <Waveform className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
          <p className="text-sm font-medium text-white">AI Separation</p>
          <p className="text-xs text-gray-400">Advanced neural networks</p>
        </div>
        <div className="glass-dark rounded-lg p-4 border border-white/10">
          <Music className="h-8 w-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium text-white">4 Stems</p>
          <p className="text-xs text-gray-400">Vocals, drums, bass, other</p>
        </div>
        <div className="glass-dark rounded-lg p-4 border border-white/10">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-400" />
          <p className="text-sm font-medium text-white">High Quality</p>
          <p className="text-xs text-gray-400">Studio-grade output</p>
        </div>
      </div>
    </div>
  );
} 