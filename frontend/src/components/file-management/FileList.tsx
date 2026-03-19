'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive,
  MoreVertical,
  Calendar,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/base/Toast';
import { FileItem } from '@/types/file.types';
import { downloadFile, deleteFile } from '@/services/file.service';

export interface FileListProps {
  files: FileItem[];
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRefresh?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  providerId: string;
  className?: string;
  viewMode?: 'grid' | 'list';
}

interface FileWithActions extends FileItem {
  isDeleting?: boolean;
  isDownloading?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onDownload,
  onDelete,
  onRefresh,
  loading = false,
  emptyMessage = 'No files found',
  providerId,
  className = '',
  viewMode = 'grid',
}) => {
  const [filesWithActions, setFilesWithActions] = useState<FileWithActions[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  // Update files with actions when files prop changes
  React.useEffect(() => {
    setFilesWithActions(files.map(file => ({ ...file })));
  }, [files]);

  // Handle file download
  const handleDownload = useCallback(async (file: FileWithActions) => {
    if (file.isDownloading) return;

    try {
      // Update file state to show downloading
      setFilesWithActions(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, isDownloading: true }
            : f
        )
      );

      if (onDownload) {
        await onDownload(file);
      } else {
        // Default download behavior
        await downloadFile(file.id, providerId);
      }

      addToast({
        type: 'success',
        title: 'Download started',
        message: `Downloading ${file.name}`,
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download failed',
        message: error instanceof Error ? error.message : 'Failed to download file',
      });
    } finally {
      // Reset downloading state
      setFilesWithActions(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, isDownloading: false }
            : f
        )
      );
    }
  }, [onDownload, providerId, addToast]);

  // Handle file deletion
  const handleDelete = useCallback(async (file: FileWithActions) => {
    if (file.isDeleting) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      // Update file state to show deleting
      setFilesWithActions(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, isDeleting: true }
            : f
        )
      );

      if (onDelete) {
        await onDelete(file);
      } else {
        // Default delete behavior
        await deleteFile(file.id, providerId);
        
        // Remove file from local state
        setFilesWithActions(prev => prev.filter(f => f.id !== file.id));
      }

      addToast({
        type: 'success',
        title: 'File deleted',
        message: `${file.name} has been deleted`,
      });

      // Refresh file list if callback provided
      if (onRefresh) {
        onRefresh();
      }

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: error instanceof Error ? error.message : 'Failed to delete file',
      });
      
      // Reset deleting state on error
      setFilesWithActions(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, isDeleting: false }
            : f
        )
      );
    }
  }, [onDelete, providerId, addToast, onRefresh]);

  // Get file type icon
  const getFileIcon = useCallback((file: FileWithActions) => {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (type.startsWith('video/')) {
      return <Video className="w-5 h-5" />;
    } else if (type.startsWith('audio/')) {
      return <Music className="w-5 h-5" />;
    } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="w-5 h-5" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
      return <Archive className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  }, []);

  // Generate thumbnail for supported image formats
  const generateThumbnail = useCallback((file: FileWithActions): string | undefined => {
    if (!file.type.startsWith('image/')) {
      return undefined;
    }

    // If thumbnail URL is provided, use it
    if (file.thumbnail) {
      return file.thumbnail;
    }

    // If download URL is available, use it for thumbnail
    if (file.downloadUrl) {
      return file.downloadUrl;
    }

    return undefined;
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format date
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  // Memoized file items
  const fileItems = useMemo(() => {
    return filesWithActions.map(file => ({
      ...file,
      thumbnail: file.thumbnail || generateThumbnail(file),
    }));
  }, [filesWithActions, generateThumbnail]);

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (fileItems.length === 0) {
    return (
      <Card className={`text-center py-12 ${className}`}>
        <File className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload some files to get started
        </p>
      </Card>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        <AnimatePresence>
          {fileItems.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <FileGridItem
                file={file}
                onDownload={handleDownload}
                onDelete={handleDelete}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // List view
  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence>
        {fileItems.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <FileListItem
              file={file}
              onDownload={handleDownload}
              onDelete={handleDelete}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Grid item component
interface FileItemProps {
  file: FileWithActions;
  onDownload: (file: FileWithActions) => void;
  onDelete: (file: FileWithActions) => void;
  getFileIcon: (file: FileWithActions) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
}

const FileGridItem: React.FC<FileItemProps> = ({
  file,
  onDownload,
  onDelete,
  getFileIcon,
  formatFileSize,
  formatDate,
}) => {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Thumbnail or icon */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if thumbnail fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${file.thumbnail ? 'hidden' : 'flex'} items-center justify-center w-full h-full text-gray-400 dark:text-gray-500`}>
          <div className="text-4xl">
            {getFileIcon(file)}
          </div>
        </div>
        
        {/* Action overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownload(file)}
            disabled={file.isDownloading || file.isDeleting}
            loading={file.isDownloading}
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(file)}
            disabled={file.isDownloading || file.isDeleting}
            loading={file.isDeleting}
            className="bg-red-500/90 text-white hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* File info */}
      <div className="p-3">
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate mb-1" title={file.name}>
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(file.size)}</span>
          <span>{formatDate(file.uploadDate)}</span>
        </div>
      </div>
    </Card>
  );
};

// List item component
const FileListItem: React.FC<FileItemProps> = ({
  file,
  onDownload,
  onDelete,
  getFileIcon,
  formatFileSize,
  formatDate,
}) => {
  return (
    <Card className="group hover:shadow-md transition-all duration-200" padding="sm">
      <div className="flex items-center space-x-4">
        {/* Thumbnail or icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                // Fallback to icon if thumbnail fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${file.thumbnail ? 'hidden' : 'flex'} items-center justify-center text-gray-400 dark:text-gray-500`}>
            {getFileIcon(file)}
          </div>
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate mb-1" title={file.name}>
            {file.name}
          </h4>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <HardDrive className="w-3 h-3 mr-1" />
              {formatFileSize(file.size)}
            </span>
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(file.uploadDate)}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(file)}
            disabled={file.isDownloading || file.isDeleting}
            loading={file.isDownloading}
            className="h-8 w-8 p-0"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file)}
            disabled={file.isDownloading || file.isDeleting}
            loading={file.isDeleting}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FileList;