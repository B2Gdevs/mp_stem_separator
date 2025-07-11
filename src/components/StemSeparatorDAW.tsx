'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Upload, 
  FolderOpen, 
  Settings, 
  Activity,
  PlayCircle,
  PauseCircle,
  Cpu,
  HardDrive,
  Zap,
  Volume2,
  Waveform,
  Layers,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';
import { JobsManager } from '@/components/JobsManager';
import { ProjectManager } from '@/components/ProjectManager';

export function StemSeparatorDAW() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Header Bar - DAW Style */}
      <motion.header 
        className="glass-dark border-b border-white/10 px-6 py-4"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Waveform className="h-8 w-8 text-indigo-400" />
                <div className="absolute inset-0 animate-pulse">
                  <Waveform className="h-8 w-8 text-indigo-600 opacity-50" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Stem Separator Pro
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Audio Separation</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Activity className="h-4 w-4 text-green-400" />
              <span>Online</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span>Ready</span>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar - Project Navigator */}
        <motion.aside 
          className="w-80 glass-dark border-r border-white/10 p-6"
          variants={itemVariants}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <FolderOpen className="h-4 w-4 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start gradient-primary text-white border-0" 
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-white/10"
                  onClick={() => setActiveTab('projects')}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Project Manager
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-white/10"
                  onClick={() => setActiveTab('jobs')}
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Processing Queue
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Music className="h-4 w-4 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-white">Track_01.wav</p>
                  <p className="text-xs text-gray-400">Completed • 2 mins ago</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-white">Song_Master.mp3</p>
                  <p className="text-xs text-gray-400">Processing • 45% done</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                System Status
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>GPU Usage</span>
                    <span>32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Memory</span>
                    <span>8.2GB / 16GB</span>
                  </div>
                  <Progress value={51} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.main 
          className="flex-1 p-6"
          variants={itemVariants}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass-dark border border-white/10">
              <TabsTrigger value="upload" className="data-[state=active]:bg-white/20">
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-white/20">
                <Layers className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-white/20">
                <Activity className="h-4 w-4 mr-2" />
                Processing
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <TabsContent value="upload" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="glass-dark border-white/10">
                      <CardHeader>
                        <CardTitle className="flex items-center text-white">
                          <Volume2 className="h-5 w-5 mr-2 text-indigo-400" />
                          Audio Stem Separation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FileUpload />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="glass-dark border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-full bg-green-500/20">
                              <Music className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white">Vocals</p>
                              <p className="text-sm text-gray-400">Isolated voice tracks</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-dark border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-full bg-blue-500/20">
                              <Waveform className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white">Instruments</p>
                              <p className="text-sm text-gray-400">Bass, drums, other</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-dark border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-full bg-purple-500/20">
                              <Download className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white">Export</p>
                              <p className="text-sm text-gray-400">High-quality stems</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="projects">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProjectManager />
                  </motion.div>
                </TabsContent>

                <TabsContent value="jobs">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobsManager />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.main>
      </div>

      {/* Bottom Status Bar */}
      <motion.footer 
        className="glass-dark border-t border-white/10 px-6 py-3"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            <span>•</span>
            <span>API Connected</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>v1.0.0</span>
            <span>•</span>
            <span>Stem Separator Pro</span>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
} 