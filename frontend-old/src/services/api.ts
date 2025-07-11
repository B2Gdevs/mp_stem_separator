import axios from 'axios';

// API base URL - will be same origin in production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Job {
  job_id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface JobStatus extends Job {
  progress: number;
  message: string;
  completed_at?: string;
  error?: string;
}

export interface Stem {
  name: string;
  filename: string;
  size: number;
}

export interface StemsResponse {
  stems: Stem[];
}

export interface ProcessingResponse {
  job_id: string;
  status: string;
  message: string;
  filename: string;
}

// API endpoints
export const audioApi = {
  // Upload audio file (without processing)
  uploadAudio: async (file: File, model: string = 'htdemucs') => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ProcessingResponse>('/api/audio/upload', formData, {
      params: { model },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Start processing an uploaded file
  startProcessing: async (jobId: string) => {
    const response = await api.post<ProcessingResponse>(`/api/audio/process/${jobId}`);
    return response.data;
  },

  // Upload audio file for processing (legacy - uploads and processes in one step)
  processAudio: async (file: File, model: string = 'htdemucs') => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ProcessingResponse>('/api/audio/process', formData, {
      params: { model },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get list of stems for a job
  getStems: async (jobId: string) => {
    const response = await api.get<StemsResponse>(`/api/audio/stems/${jobId}`);
    return response.data;
  },

  // Download a stem
  downloadStem: async (jobId: string, stemName: string) => {
    // Create a direct download link to let the browser handle the download
    const downloadUrl = `${API_BASE_URL}/api/audio/download/${jobId}/${stemName}`;
    
    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Delete a job
  deleteJob: async (jobId: string) => {
    const response = await api.delete(`/api/audio/job/${jobId}`);
    return response.data;
  },
};

export const jobsApi = {
  // Get job status
  getJobStatus: async (jobId: string) => {
    const response = await api.get<JobStatus>(`/api/jobs/${jobId}`);
    return response.data;
  },

  // List all jobs
  listJobs: async (status?: string, limit: number = 50, offset: number = 0) => {
    const response = await api.get<Job[]>('/api/jobs/', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  // Cancel a job
  cancelJob: async (jobId: string) => {
    const response = await api.post(`/api/jobs/${jobId}/cancel`);
    return response.data;
  },
};

export const healthApi = {
  // Check API health
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
}; 