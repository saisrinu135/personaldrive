'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FolderOpen, 
  Grid, 
  List, 
  Search,
  RefreshCw,
  Settings,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/base/Toast';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { FileSearch } from './FileSearch';
import { FolderBreadcrumb } from './FolderBreadcrumb';
import { FolderManager } from './FolderManager';
import { FileOrganizer } from './FileOrganizer';
import { FileItem, FolderItem } from '@/types/file.types';
import { 
  getFolderContents, 
  toFileMetadata,
  uploadFile,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFile
} from '@/services/file.service';

export interface FileManagerProps {
  providerId: string;
  initialPath?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type TabMode = 'files' | 'folders' | 'organize';

export const FileManager: React.FC<FileManagerProps> = ({
  providerId,
  initialPath = '',
  className = '',
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<TabMode>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const { addToast } = useToast();

  // Load folder contents
  const loadFolderContents = useCallback(async (folderPath: string = currentPath) => {
    setLoading(true);
    try {
      const response = await getFolderContents(folderPath, providerId);
      
      // Convert API response to FileItem format
      const fileItems: FileItem[] = response.files.map(file => ({
        id: file.id,
        name: file.filename,
        size: file.size_bytes,
        type: file.content_type || 'application/octet-stream',
        uploadDate: new Date(file.uploaded_at),
        folderPath: folderPath,
      }));

      setFiles(fileItems);
      setFolders(response.folders);
      setCurrentPath(folderPath);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load folder contents',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPath, providerId, addToast]);

  // Initial load
  useEffect(() => {
    loadFolderContents(initialPath);
  }, [loadFolderContents, initialPath]);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [files, searchQuery]);

  // Handle search results from FileSearch component
  const handleSearchResults = useCallback((results: FileItem[]) => {
    setSearchResults(results);
    setFilteredFiles(results);
  }, []);

  // Handle folder navigation
  const handleFolderNavigation = useCallback((folderPath: string) => {
    loadFolderContents(folderPath);
  }, [loadFolderContents]);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadFiles: File[]) => {
    try {
      for (const file of uploadFiles) {
        await uploadFile(file, {
          providerId,
          folderPath: currentPath,
        });
      }
      
      // Refresh folder contents
      await loadFolderContents();
      setShowUploader(false);
    } catch (error) {
      throw error; // Let FileUploader handle the error display
    }
  }, [providerId, currentPath, loadFolderContents]);

  // Handle folder operations
  const handleFolderCreate = useCallback(async (folderPath: string, folderName: string) => {
    await createFolder(folderPath, folderName, providerId);
    await loadFolderContents();
  }, [providerId, loadFolderContents]);

  const handleFolderRename = useCallback(async (oldPath: string, newName: string) => {
    await renameFolder(oldPath, newName, providerId);
    await loadFolderContents();
  }, [providerId, loadFolderContents]);

  const handleFolderDelete = useCallback(async (folderPath: string) => {
    await deleteFolder(folderPath, providerId);
    await loadFolderContents();
  }, [providerId, loadFolderContents]);

  // Handle file move
  const handleFileMove = useCallback(async (fileId: string, newFolderPath: string) => {
    await moveFile(fileId, newFolderPath, providerId);
    await loadFolderContents();
  }, [providerId, loadFolderContents]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadFolderContents();
  }, [loadFolderContents]);

  // Get tab content
  const getTabContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <div className="space-y-4">
            {/* Enhanced search component */}
            <FileSearch
              files={files}
              onSearchResults={handleSearchResults}
              placeholder="Search files by name or type..."
              showFilters={true}
              className="mb-4"
            />

            {/* View controls */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* File list */}
            <FileList
              files={filteredFiles}
              providerId={providerId}
              loading={loading}
              viewMode={viewMode}
              onRefresh={handleRefresh}
              emptyMessage={
                searchResults.length === 0 && files.length > 0
                  ? 'No files found matching your search criteria'
                  : 'No files in this folder'
              }
            />
          </div>
        );

      case 'folders':
        return (
          <FolderManager
            folders={folders}
            currentPath={currentPath}
            providerId={providerId}
            onFolderClick={handleFolderNavigation}
            onFolderCreate={handleFolderCreate}
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            onRefresh={handleRefresh}
          />
        );

      case 'organize':
        return (
          <FileOrganizer
            files={files}
            folders={folders}
            currentPath={currentPath}
            providerId={providerId}
            onFileMove={handleFileMove}
            onRefresh={handleRefresh}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            File Manager
          </h2>
          <FolderBreadcrumb
            currentPath={currentPath}
            onNavigate={handleFolderNavigation}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowUploader(!showUploader)}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload Files
          </Button>
        </div>
      </div>

      {/* File uploader */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FileUploader
              providerId={providerId}
              folderPath={currentPath}
              onUpload={handleFileUpload}
              multiple={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('files')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${activeTab === 'files'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4" />
              <span>Files ({searchResults.length > 0 ? searchResults.length : filteredFiles.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('folders')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${activeTab === 'folders'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4" />
              <span>Folders ({folders.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('organize')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${activeTab === 'organize'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Organize</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {getTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Empty state for no provider */}
      {!providerId && (
        <Card className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Storage Provider Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Please configure a storage provider to manage your files
          </p>
          <Button variant="primary">
            Configure Provider
          </Button>
        </Card>
      )}
    </div>
  );
};

export default FileManager;