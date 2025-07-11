'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';

interface LogsViewerProps {
  jobId: string;
  autoRefresh?: boolean;
}

export function LogsViewer({ jobId, autoRefresh = false }: LogsViewerProps) {
  // This is a simplified version - we'll enhance this later
  const mockLogs = [
    { timestamp: new Date().toISOString(), level: 'info', message: 'Starting audio processing...' },
    { timestamp: new Date().toISOString(), level: 'info', message: 'Loading model htdemucs...' },
    { timestamp: new Date().toISOString(), level: 'info', message: 'Processing audio file...' },
  ];

  return (
    <Card className="glass-dark border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-white">
          <Activity className="h-4 w-4 mr-2 text-blue-400" />
          Processing Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full">
          <div className="space-y-1 font-mono text-sm">
            {mockLogs.map((log, index) => (
              <div key={index} className="text-gray-300">
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`ml-2 ${log.level === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 