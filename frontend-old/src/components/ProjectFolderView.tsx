import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Folder, 
  FileAudio,
  MoreHorizontal,
  Play,
  Info,
  Calendar,
  HardDrive,
  User
} from 'lucide-react';
import { audioApi, Stem } from '@/services/api';

interface ProjectFolderViewProps {
  job: any;
  stems: { stems: Stem[] } | undefined;
  onDownload: (stemName: string) => void;
}

export function ProjectFolderView({ job, stems, onDownload }: ProjectFolderViewProps) {
  const [selectedStem, setSelectedStem] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStemIcon = (stemName: string) => {
    const stemColors = {
      vocals: 'text-blue-600',
      drums: 'text-red-600', 
      bass: 'text-green-600',
      other: 'text-purple-600'
    };
    
    return stemColors[stemName as keyof typeof stemColors] || 'text-gray-600';
  };

  const getStemDescription = (stemName: string) => {
    const descriptions = {
      vocals: 'Lead vocals and harmonies',
      drums: 'Drums and percussion',
      bass: 'Bass guitar and low frequencies',
      other: 'Guitars, synths, and other instruments'
    };
    
    return descriptions[stemName as keyof typeof descriptions] || 'Audio stem';
  };

  if (!stems || !stems.stems || stems.stems.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Folder className="h-12 w-12 mx-auto mb-4" />
        <p>No stems available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/20 p-3 rounded-lg">
            <Folder className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{job.filename}</h2>
            <p className="text-muted-foreground">Stem Separation Project</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(job.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <FileAudio className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stems.stems.length}</p>
          <p className="text-sm text-muted-foreground">Stems</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <HardDrive className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">
            {formatFileSize(stems.stems.reduce((total, stem) => total + stem.size, 0))}
          </p>
          <p className="text-sm text-muted-foreground">Total Size</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <User className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{job.model}</p>
          <p className="text-sm text-muted-foreground">Model Used</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">WAV</p>
          <p className="text-sm text-muted-foreground">Format</p>
        </div>
      </div>

      {/* Folder Structure */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b">
          <div className="flex items-center space-x-2">
            <Folder className="h-4 w-4" />
            <span className="font-medium">Project Files</span>
            <span className="text-muted-foreground">/ {job.filename.replace(/\.[^/.]+$/, "")}</span>
          </div>
        </div>

        <div className="divide-y">
          {stems.stems.map((stem, index) => (
            <div
              key={stem.name}
              className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                selectedStem === stem.name ? 'bg-primary/10 border-l-4 border-l-primary' : ''
              }`}
              onClick={() => setSelectedStem(selectedStem === stem.name ? null : stem.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg bg-background border-2 ${getStemIcon(stem.name)}`}>
                    <FileAudio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{stem.name}.wav</h3>
                    <p className="text-sm text-muted-foreground">
                      {getStemDescription(stem.name)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{formatFileSize(stem.size)}</p>
                    <p className="text-xs text-muted-foreground">Audio File</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(stem.name);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>

              {selectedStem === stem.name && (
                <div className="mt-4 pt-4 border-t bg-muted/20 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">File Name</p>
                      <p className="font-mono">{stem.filename}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">File Size</p>
                      <p>{formatFileSize(stem.size)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Type</p>
                      <p>WAV Audio</p>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDownload(stem.name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download {stem.name}
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Play className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Info className="h-3 w-3 mr-1" />
                      Properties
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {stems.stems.length} files • Total size: {formatFileSize(stems.stems.reduce((total, stem) => total + stem.size, 0))}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Download All as ZIP
          </Button>
          <Button variant="outline" size="sm" disabled>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 