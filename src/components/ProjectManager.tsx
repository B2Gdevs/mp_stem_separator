'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  FolderOpen, 
  Plus, 
  Search, 
  MoreVertical,
  Download,
  Trash2,
  Edit,
  Music,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useJobs } from '@/hooks/useAudioHooks';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'archived';
  jobs: any[];
}

export function ProjectManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Album Masters',
      description: 'Professional album stem separation project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      jobs: []
    },
    {
      id: '2', 
      name: 'Demo Tracks',
      description: 'Testing different AI models',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      jobs: []
    }
  ]);

  const { data: allJobs } = useJobs();

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${projects.length + 1}`,
      description: 'New project description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      jobs: []
    };
    setProjects([newProject, ...projects]);
    toast.success('New project created');
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    toast.success('Project deleted');
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <Layers className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Project Manager</h2>
        </div>
        <Button 
          onClick={handleCreateProject}
          className="gradient-primary text-white border-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-dark border-white/10 text-white placeholder-gray-400"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {projects.filter(p => p.status === 'active').length} Active
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            {projects.filter(p => p.status === 'completed').length} Completed
          </Badge>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="glass-dark border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <FolderOpen className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{project.name}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} text-xs mt-1`}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-dark border-white/10">
                        <DropdownMenuItem className="text-white hover:bg-white/10">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-white hover:bg-white/10">
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-400">{project.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(project.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated: {formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Music className="h-3 w-3" />
                      <span>{project.jobs.length} files</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FolderOpen className="mr-1 h-3 w-3" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-400"
        >
          <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl mb-2">No projects found</p>
          <p className="text-gray-500">Create a new project to organize your audio separation work</p>
          <Button 
            onClick={handleCreateProject}
            className="mt-4 gradient-primary text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </motion.div>
      )}
    </div>
  );
} 