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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/base/Toast';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { FileSearch } from './FileSearch';
import { FileItem } from '@/types/file.types';
import { 
  listFiles, 
  uploadFile,
} from '@/services/file.service';

export interface FileManagerProps {
  providerId: string;
  initialPath?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export const FileManager: React.FC<FileManagerProps> = ({
  providerId,
  initialPath = '',
  className = '',
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const { addToast } = useToast();

  // Load all files
  const loadFiles = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const response = await listFiles({ providerId });
      
      // Convert API response to FileItem format
      const fileItems: FileItem[] = response.objects.map(file => ({
        id: String(file.id),
        name: file.filename,
        size: file.size_bytes,
        type: file.content_type || 'application/octet-stream',
        uploadDate: new Date(file.uploaded_at),
        folderPath: '',
      }));

      setFiles(fileItems);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load files',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, [providerId, addToast]);

  // Initial load
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadFiles: File[]) => {
    try {
      for (const file of uploadFiles) {
        await uploadFile(file, { providerId });
      }
      
      // Refresh files
      await loadFiles();
      setShowUploader(false);
    } catch (error) {
      throw error; // Let FileUploader handle the error display
    }
  }, [providerId, loadFiles]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            File Manager
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || !providerId}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowUploader(!showUploader)}
            disabled={!providerId}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload Files
          </Button>
        </div>
      </div>

      {/* File uploader */}
      <AnimatePresence>
        {showUploader && providerId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FileUploader
              providerId={providerId}
              onUpload={handleFileUpload}
              multiple={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state for no provider */}
      {!providerId ? (
        <Card className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Storage Provider Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Please configure a storage provider to manage your files
          </p>
        </Card>
      ) : (
        <div className="space-y-4 min-h-[400px]">
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
                : 'No files uploaded yet'
            }
          />
        </div>
      )}
    </div>
  );
};

export default FileManager;