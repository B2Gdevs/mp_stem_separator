import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { audioApi, jobsApi } from '@/services/api';

// Query keys
export const audioQueryKeys = {
  all: ['audio'] as const,
  jobs: () => [...audioQueryKeys.all, 'jobs'] as const,
  job: (jobId: string) => [...audioQueryKeys.jobs(), jobId] as const,
  jobStatus: (jobId: string) => [...audioQueryKeys.job(jobId), 'status'] as const,
  stems: (jobId: string) => [...audioQueryKeys.job(jobId), 'stems'] as const,
};

// Hook to upload audio file (without processing)
export const useUploadAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, model }: { file: File; model?: string }) => 
      audioApi.uploadAudio(file, model),
    onSuccess: () => {
      // Invalidate jobs list to show the new job
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobs() });
    },
  });
};

// Hook to start processing an uploaded file
export const useStartProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => audioApi.startProcessing(jobId),
    onSuccess: (_, jobId) => {
      // Invalidate job status to show processing
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobStatus(jobId) });
    },
  });
};

// Hook to upload and process audio file (legacy)
export const useProcessAudio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, model }: { file: File; model?: string }) => 
      audioApi.processAudio(file, model),
    onSuccess: () => {
      // Invalidate jobs list to show the new job
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobs() });
    },
  });
};

// Hook to get job status with automatic polling
export const useJobStatus = (jobId: string | null) => {
  return useQuery({
    queryKey: audioQueryKeys.jobStatus(jobId!),
    queryFn: () => jobsApi.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });
};

// Hook to list all jobs
export const useJobs = (status?: string, limit: number = 50, offset: number = 0) => {
  return useQuery({
    queryKey: [...audioQueryKeys.jobs(), { status, limit, offset }],
    queryFn: () => jobsApi.listJobs(status, limit, offset),
  });
};

// Hook to get stems for a job
export const useStems = (jobId: string | null) => {
  return useQuery({
    queryKey: audioQueryKeys.stems(jobId!),
    queryFn: () => audioApi.getStems(jobId!),
    enabled: !!jobId,
  });
};

// Hook to delete a job
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => audioApi.deleteJob(jobId),
    onSuccess: (_, jobId) => {
      // Remove job from cache
      queryClient.removeQueries({ queryKey: audioQueryKeys.job(jobId) });
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobs() });
    },
  });
};

// Hook to cancel a job
export const useCancelJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobsApi.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      // Invalidate job status
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobStatus(jobId) });
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: audioQueryKeys.jobs() });
    },
  });
}; 