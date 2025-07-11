import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ThemeMenu } from '@/components/ThemeMenu';
import { FileUpload } from '@/components/FileUpload';
import { JobsManager } from '@/components/JobsManager';
import { Button } from '@/components/ui/button';
import { Download, Music, RefreshCw, CheckCircle, Clock, AlertCircle, Play, Plus, History } from 'lucide-react';
import { useJobStatus, useStems, useStartProcessing } from '@/hooks/useAudioHooks';
import { audioApi, Stem } from '@/services/api';
import LogsViewer from '@/components/LogsViewer';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});

type TabType = 'new' | 'history';

interface UploadedJob {
  jobId: string;
  filename: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

function ProcessingWorkflow({ job }: { job: UploadedJob }) {
  const { data: status, isLoading } = useJobStatus(job.jobId);
  const { data: stems } = useStems(job.jobId);
  const startProcessingMutation = useStartProcessing();

  const handleStartProcessing = async () => {
    try {
      await startProcessingMutation.mutateAsync(job.jobId);
    } catch (error) {
      console.error('Failed to start processing:', error);
    }
  };

  const handleDownload = async (stemName: string) => {
    try {
      await audioApi.downloadStem(job.jobId, stemName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading job status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Could not load job status</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{job.filename}</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          status.status === 'completed' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : status.status === 'processing' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : status.status === 'failed'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }`}>
          {status.status === 'completed' && <CheckCircle className="h-4 w-4" />}
          {status.status === 'processing' && <RefreshCw className="h-4 w-4 animate-spin" />}
          {status.status === 'failed' && <AlertCircle className="h-4 w-4" />}
          {status.status === 'pending' && <Clock className="h-4 w-4" />}
          <span className="capitalize">{status.status}</span>
        </div>
      </div>

      {status.status === 'pending' && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            File uploaded successfully. Click the button below to start processing.
          </p>
          <Button 
            onClick={handleStartProcessing}
            disabled={startProcessingMutation.isPending}
            className="w-full"
          >
            {startProcessingMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Processing
              </>
            )}
          </Button>
        </div>
      )}

      {status.status === 'processing' && status.progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Processing stems...</span>
            <span>{Math.round(status.progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{status.message}</p>
        </div>
      )}

      {/* Real-time logs during processing */}
      {status.status === 'processing' && (
        <div className="mb-6">
          <LogsViewer 
            jobId={job.jobId}
            autoRefresh={true}
            refreshInterval={1000}
          />
        </div>
      )}

      {status.error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{status.error}</p>
        </div>
      )}

      {/* Show logs for failed jobs so users can see what went wrong */}
      {status.status === 'failed' && (
        <div className="mb-6">
          <LogsViewer 
            jobId={job.jobId}
            autoRefresh={false}
          />
        </div>
      )}

      {status.status === 'completed' && stems && (
        <div className="space-y-3">
          <h4 className="font-medium">Download Stems:</h4>
          <div className="grid grid-cols-2 gap-2">
            {stems.stems.map((stem: Stem) => (
              <Button
                key={stem.name}
                variant="outline"
                size="sm"
                onClick={() => handleDownload(stem.name)}
                className="justify-start"
              >
                <Download className="mr-2 h-3 w-3" />
                {stem.name}
                <span className="ml-auto text-xs text-muted-foreground">
                  {(stem.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [currentJob, setCurrentJob] = useState<UploadedJob | null>(null);

  const handleUploadSuccess = (jobId: string, filename: string) => {
    setCurrentJob({ jobId, filename, status: 'uploaded' });
  };

  const handleNewUpload = () => {
    setCurrentJob(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'new') {
      setCurrentJob(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Stem Separator</h1>
          </div>
          <ThemeMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 border-b">
            <Button
              variant={activeTab === 'new' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('new')}
              className="rounded-none border-b-2 border-transparent hover:border-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Processing
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              onClick={() => handleTabChange('history')}
              className="rounded-none border-b-2 border-transparent hover:border-primary"
            >
              <History className="mr-2 h-4 w-4" />
              Job History
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'new' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Separate Your Audio</h2>
                <p className="text-muted-foreground">
                  Upload an audio file and extract vocals, drums, bass, and other instruments
                </p>
              </div>

              {!currentJob ? (
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              ) : (
                <div className="space-y-6">
                  <ProcessingWorkflow job={currentJob} />
                  <div className="text-center">
                    <Button onClick={handleNewUpload} variant="outline">
                      <Music className="mr-2 h-4 w-4" />
                      Process Another File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <JobsManager />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
