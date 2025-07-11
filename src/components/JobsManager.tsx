'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileSearch,
  Play,
  Pause,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useJobs, useDeleteJob, useJobStatus, useStems } from '@/hooks/useAudioHooks';
import { audioApi, Stem } from '@/services/api';
import { ProjectFolderView } from '@/components/ProjectFolderView';
import { LogsViewer } from '@/components/LogsViewer';
import { toast } from 'sonner';

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
  const [showLogs, setShowLogs] = useState(currentStatus === 'processing' || currentStatus === 'failed');
  
  React.useEffect(() => {
    if (currentStatus === 'processing' || currentStatus === 'failed') {
      setShowLogs(true);
    }
  }, [currentStatus]);

  const handleDownload = async (stemName: string) => {
    try {
      await audioApi.downloadStem(job.job_id, stemName);
      toast.success(`Downloaded ${stemName}`);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJobMutation.mutateAsync(job.job_id);
      onDelete(job.job_id);
      toast.success('Job deleted successfully');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isCompleted = currentStatus === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-dark border border-white/10 rounded-xl overflow-hidden"
    >
      <div className="p-6 hover:bg-white/5 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{job.filename}</h3>
              <p className="text-sm text-gray-400">
                {formatDate(job.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(currentStatus)} border`}>
              {getStatusIcon(currentStatus)}
              <span className="capitalize ml-1">{currentStatus}</span>
            </Badge>
            {(currentStatus === 'processing' || currentStatus === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className="border-white/20 text-white hover:bg-white/10"
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
                className="border-white/20 text-white hover:bg-white/10"
              >
                {showFolderView ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                View Files
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-white hover:bg-white/10"
            >
              {expanded ? 'Less' : 'Details'}
            </Button>
          </div>
        </div>

        {currentStatus === 'processing' && status?.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Processing:</span>
              <span className="text-white font-medium">{Math.round(status.progress)}%</span>
            </div>
            <Progress value={status.progress} className="h-3 bg-gray-800">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" />
            </Progress>
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-white/10"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-300">Job ID:</p>
                  <p className="text-gray-400 font-mono text-xs">{job.job_id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300">Model:</p>
                  <p className="text-gray-400">{job.model || 'htdemucs'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300">Updated:</p>
                  <p className="text-gray-400">{formatDate(job.updated_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-300">Progress:</p>
                  <p className="text-gray-400">{status?.progress || 0}%</p>
                </div>
              </div>

              {status?.message && (
                <div>
                  <p className="font-medium text-sm text-gray-300">Status Message:</p>
                  <p className="text-gray-400 text-sm">{status.message}</p>
                </div>
              )}

              {status?.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-medium text-sm text-red-400">Error:</p>
                  <p className="text-red-400 text-sm">{status.error}</p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogs(!showLogs)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <FileSearch className="mr-2 h-3 w-3" />
                  {showLogs ? 'Hide Logs' : 'Show Logs'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteJobMutation.isPending}
                  className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                >
                  {deleteJobMutation.isPending ? (
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-3 w-3" />
                  )}
                  Delete Job
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-black/20 p-6"
          >
            <LogsViewer 
              jobId={job.job_id}
              autoRefresh={currentStatus === 'processing'}
            />
          </motion.div>
        )}

        {showFolderView && isCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-black/20 p-6"
          >
            <ProjectFolderView 
              job={job}
              stems={stems}
              onDownload={handleDownload}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-indigo-400" />
        </motion.div>
        <span className="ml-3 text-lg text-white">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Processing Queue</h2>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4"
      >
        <Card className="glass-dark border-white/10 text-center">
          <CardContent className="p-6">
            <HardDrive className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-400">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/10 text-center">
          <CardContent className="p-6">
            <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-400" />
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/10 text-center">
          <CardContent className="p-6">
            <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-400" />
            <p className="text-3xl font-bold text-white">{stats.processing}</p>
            <p className="text-sm text-gray-400">Processing</p>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/10 text-center">
          <CardContent className="p-6">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
            <p className="text-3xl font-bold text-white">{stats.failed}</p>
            <p className="text-sm text-gray-400">Failed</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex space-x-2"
      >
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
          className={statusFilter === '' ? 'gradient-primary border-0' : 'border-white/20 text-white hover:bg-white/10'}
        >
          All Projects
        </Button>
        <Button
          variant={statusFilter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('completed')}
          className={statusFilter === 'completed' ? 'gradient-primary border-0' : 'border-white/20 text-white hover:bg-white/10'}
        >
          Completed
        </Button>
        <Button
          variant={statusFilter === 'processing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('processing')}
          className={statusFilter === 'processing' ? 'gradient-primary border-0' : 'border-white/20 text-white hover:bg-white/10'}
        >
          Processing
        </Button>
        <Button
          variant={statusFilter === 'failed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('failed')}
          className={statusFilter === 'failed' ? 'gradient-primary border-0' : 'border-white/20 text-white hover:bg-white/10'}
        >
          Failed
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {jobs && jobs.length > 0 ? (
            jobs.map((job, index) => (
              <motion.div
                key={job.job_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobCard
                  job={job}
                  onDelete={handleJobDeleted}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-400"
            >
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl mb-2">No projects found</p>
              <p className="text-gray-500">Process some audio files to see them here</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 