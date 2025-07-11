import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  History,
  FileText,
  Calendar,
  HardDrive,
  ChevronDown,
  ChevronRight,
  FileSearch
} from 'lucide-react';
import { useJobs, useDeleteJob, useJobStatus, useStems } from '@/hooks/useAudioHooks';
import { audioApi, Stem } from '@/services/api';
import { ProjectFolderView } from '@/components/ProjectFolderView';
import LogsViewer from '@/components/LogsViewer';

interface JobCardProps {
  job: any;
  onDelete: (jobId: string) => void;
}

function JobCard({ job, onDelete }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFolderView, setShowFolderView] = useState(false);
  const { data: status } = useJobStatus(job.job_id);
  const { data: stems } = useStems(job.job_id);
  const deleteJobMutation = useDeleteJob();
  
  const currentStatus = status?.status || job.status;
  // Auto-show logs for processing and failed jobs
  const [showLogs, setShowLogs] = useState(currentStatus === 'processing' || currentStatus === 'failed');
  
  // Auto-show logs when status changes to processing
  React.useEffect(() => {
    if (currentStatus === 'processing' || currentStatus === 'failed') {
      setShowLogs(true);
    }
  }, [currentStatus]);

  const handleDownload = async (stemName: string) => {
    try {
      await audioApi.downloadStem(job.job_id, stemName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job and all its files?')) {
      try {
        await deleteJobMutation.mutateAsync(job.job_id);
        onDelete(job.job_id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isCompleted = currentStatus === 'completed';

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-medium">{job.filename}</h3>
              <p className="text-sm text-muted-foreground">
                Created: {formatDate(job.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(currentStatus)}`}>
              {getStatusIcon(currentStatus)}
              <span className="capitalize">{currentStatus}</span>
            </div>
            {(currentStatus === 'processing' || currentStatus === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
              >
                <FileSearch className="mr-1 h-3 w-3" />
                {showLogs ? 'Hide Logs' : 'View Logs'}
              </Button>
            )}
            {isCompleted && stems && stems.stems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFolderView(!showFolderView)}
              >
                {showFolderView ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                View Files
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Less' : 'Details'}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Job ID:</p>
                <p className="text-muted-foreground font-mono text-xs">{job.job_id}</p>
              </div>
              <div>
                <p className="font-medium">Model:</p>
                <p className="text-muted-foreground">{job.model}</p>
              </div>
              <div>
                <p className="font-medium">Updated:</p>
                <p className="text-muted-foreground">{formatDate(job.updated_at)}</p>
              </div>
              <div>
                <p className="font-medium">Progress:</p>
                <p className="text-muted-foreground">{status?.progress || 0}%</p>
              </div>
            </div>

            {status?.message && (
              <div>
                <p className="font-medium text-sm">Status Message:</p>
                <p className="text-muted-foreground text-sm">{status.message}</p>
              </div>
            )}

            {status?.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="font-medium text-sm text-destructive">Error:</p>
                <p className="text-destructive text-sm">{status.error}</p>
              </div>
            )}

            {currentStatus === 'processing' && status?.progress !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Processing:</span>
                  <span>{Math.round(status.progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
              >
                <FileSearch className="mr-2 h-3 w-3" />
                {showLogs ? 'Hide Logs' : 'Show Logs'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? (
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3 w-3" />
                )}
                Delete Job
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Viewer - Visible even when not expanded */}
      {showLogs && (
        <div className="border-t bg-muted/10 p-6">
          <LogsViewer 
            jobId={job.job_id}
            autoRefresh={currentStatus === 'processing'}
          />
        </div>
      )}

      {/* Project Folder View for Completed Jobs */}
      {showFolderView && isCompleted && (
        <div className="border-t bg-muted/10 p-6">
          <ProjectFolderView 
            job={job}
            stems={stems}
            onDownload={handleDownload}
          />
        </div>
      )}
    </div>
  );
}

export function JobsManager() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: jobs, isLoading, refetch } = useJobs(statusFilter);

  const handleJobDeleted = (jobId: string) => {
    refetch();
  };

  const getJobsStats = () => {
    if (!jobs) return { total: 0, completed: 0, processing: 0, failed: 0 };
    
    return {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  };

  const stats = getJobsStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <h2 className="text-xl font-bold">Job History & File Manager</h2>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <HardDrive className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Projects</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{stats.processing}</p>
          <p className="text-sm text-muted-foreground">Processing</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
          <p className="text-2xl font-bold">{stats.failed}</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All Projects
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </Button>
        <Button
          variant={statusFilter === 'processing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('processing')}
        >
          Processing
        </Button>
        <Button
          variant={statusFilter === 'failed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('failed')}
        >
          Failed
        </Button>
      </div>

      <div className="space-y-4">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              onDelete={handleJobDeleted}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <p>No projects found</p>
            <p className="text-sm">Process some audio files to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
} 