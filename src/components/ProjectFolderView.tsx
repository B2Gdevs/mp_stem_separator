'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Music, FolderOpen } from 'lucide-react';

interface ProjectFolderViewProps {
  job: any;
  stems: any;
  onDownload: (stemName: string) => void;
}

export function ProjectFolderView({ job, stems, onDownload }: ProjectFolderViewProps) {
  const mockStems = [
    { name: 'vocals.wav', filename: 'vocals.wav', size: 15.2 },
    { name: 'drums.wav', filename: 'drums.wav', size: 12.8 },
    { name: 'bass.wav', filename: 'bass.wav', size: 8.4 },
    { name: 'other.wav', filename: 'other.wav', size: 18.6 },
  ];

  return (
    <Card className="glass-dark border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-white">
          <FolderOpen className="h-4 w-4 mr-2 text-green-400" />
          Project Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {mockStems.map((stem) => (
            <div 
              key={stem.name}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center space-x-3">
                <Music className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-white">{stem.name}</p>
                  <p className="text-xs text-gray-400">{stem.size}MB</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(stem.name)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 