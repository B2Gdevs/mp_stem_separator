import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface LogsResponse {
  job_id: string;
  logs: LogEntry[];
  total_logs: number;
  showing?: number;
}

interface LogsViewerProps {
  jobId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ 
  jobId, 
  autoRefresh = true, 
  refreshInterval = 1000 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audio/logs/${jobId}/latest?limit=100`);
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setTotalLogs(data.total_logs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const setupEventSource = () => {
    if (!autoRefresh) return;

    console.log(`[LogsViewer] Setting up SSE connection for job ${jobId}`);
    const eventSource = new EventSource(`/api/audio/logs/${jobId}/stream`);
    
    eventSource.onopen = () => {
      console.log(`[LogsViewer] SSE connection opened for job ${jobId}`);
      setError(null);
    };

    eventSource.addEventListener('connected', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const data = JSON.parse(messageEvent.data);
        console.log(`[LogsViewer] SSE connected:`, data);
      } catch (err) {
        console.error('Failed to parse connected event:', err);
      }
    });

    eventSource.addEventListener('log', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const logEntry: LogEntry = JSON.parse(messageEvent.data);
        console.log(`[LogsViewer] New log entry:`, logEntry);
        setLogs(prevLogs => {
          const newLogs = [...prevLogs, logEntry];
          setTotalLogs(newLogs.length);
          return newLogs.slice(-100); // Keep last 100 entries
        });
        setError(null);
      } catch (err) {
        console.error('Failed to parse log entry:', err);
      }
    });

    eventSource.addEventListener('heartbeat', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const heartbeatData = JSON.parse(messageEvent.data);
        console.log(`[LogsViewer] Heartbeat:`, heartbeatData);
      } catch (err) {
        console.error('Failed to parse heartbeat:', err);
      }
    });

    eventSource.addEventListener('status', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const statusData = JSON.parse(messageEvent.data);
        console.log(`[LogsViewer] Status update:`, statusData);
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          console.log(`[LogsViewer] Job ${statusData.status}, closing SSE connection`);
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse status:', err);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const errorData = JSON.parse(messageEvent.data);
        console.error(`[LogsViewer] SSE error:`, errorData);
        setError(errorData.error);
      } catch (err) {
        setError('Failed to connect to log stream');
      }
      eventSource.close();
    });

    eventSource.onerror = (event) => {
      console.error(`[LogsViewer] SSE connection error:`, event);
      setError('Connection to log stream lost');
      eventSource.close();
    };

    return eventSource;
  };

  const clearLogs = async () => {
    try {
      const response = await fetch(`/api/audio/logs/${jobId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.statusText}`);
      }
      setLogs([]);
      setTotalLogs(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  useEffect(() => {
    // Initial fetch for existing logs
    fetchLogs();
    
    // Set up real-time streaming if auto-refresh is enabled
    if (autoRefresh) {
      const eventSource = setupEventSource();
      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    }
  }, [jobId, autoRefresh]);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-600 dark:text-red-400';
      case 'WARNING':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400';
      case 'PROGRESS':
        return 'text-green-600 dark:text-green-400';
      case 'STDERR':
        return 'text-orange-600 dark:text-orange-400';
      case 'STDOUT':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  const getLevelBadge = (level: string) => {
    const baseClasses = "px-2 py-1 text-xs font-mono rounded";
    switch (level.toUpperCase()) {
      case 'ERROR':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`;
      case 'WARNING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100`;
      case 'INFO':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`;
      case 'PROGRESS':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`;
      case 'STDERR':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100`;
      case 'STDOUT':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Processing Logs</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              Auto Scroll: {autoScroll ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} of {totalLogs} log entries for job {jobId}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
            {error}
          </div>
        )}
        <ScrollArea 
          className="h-96 w-full border rounded"
          ref={scrollAreaRef}
        >
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs available
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-3 text-sm font-mono border-b border-border/50 pb-2"
                >
                  <span className="text-muted-foreground min-w-[80px]">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={getLevelBadge(log.level)}>
                    {log.level}
                  </span>
                  <span className={`flex-1 break-all ${getLevelColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogsViewer; 