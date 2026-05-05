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
  HardDrive,
  Eye,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/base/Toast';
import { FileItem } from '@/types/file.types';
import { downloadFile, deleteFile } from '@/services/file.service';
import axiosInstance from '@/lib/axios';
import { FilePreviewModal } from './FilePreviewModal';
import { FolderItem } from '@/services/folder.service';
import { Folder, Pencil } from 'lucide-react';

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
  folders?: FolderItem[];
  onFolderClick?: (folder: FolderItem) => void;
  onFolderDelete?: (folder: FolderItem) => void;
  onFolderRename?: (folder: FolderItem) => void;
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
  folders = [],
  onFolderClick,
  onFolderDelete,
  onFolderRename,
}) => {
  const [filesWithActions, setFilesWithActions] = useState<FileWithActions[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileToDelete, setFileToDelete] = useState<FileWithActions | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithActions | null>(null);
  const [shareFile, setShareFile] = useState<FileWithActions | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
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
        await downloadFile(file.id, file.name);
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

  // ─── File Deletion ───

  // Handle the initial delete button click (opens the dialog)
  const handleDeleteRequest = useCallback((file: FileWithActions) => {
    if (file.isDeleting) return;
    setFileToDelete(file);
  }, []);

  // Execute actual deletion after confirmation
  const executeDelete = useCallback(async () => {
    if (!fileToDelete) return;
    const file = fileToDelete;
    setFileToDelete(null); // Close dialog

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
        await deleteFile(file.id);
        
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
  }, [fileToDelete, onDelete, providerId, addToast, onRefresh]);

  // Handle file share
  const handleShare = useCallback(async (file: FileWithActions) => {
    try {
      const response = await axiosInstance.post(`/api/v1/objects/${file.id}/share`, {
        expiry_hours: 1
      });
      const link = response.data.data?.share_url || response.data.data?.url;
      setShareFile(file);
      setShareLink(link);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Share failed',
        message: error instanceof Error ? error.message : 'Failed to generate share link',
      });
    }
  }, [addToast]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: 'success',
      title: 'Copied',
      message: 'Share link copied to clipboard',
    });
  }, [shareLink, addToast]);

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
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-border">
            <div className="w-10 h-10 bg-secondary rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-secondary rounded w-3/4"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
            </div>
            <div className="w-16 h-6 bg-secondary rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (fileItems.length === 0 && folders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <File className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {emptyMessage}
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload some files to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
          <AnimatePresence>
            {/* Render Folders */}
            {folders.map((folder) => (
              <motion.div
                key={`folder-${folder.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FolderGridItem
                  folder={folder}
                  onClick={() => onFolderClick?.(folder)}
                  onDelete={() => onFolderDelete?.(folder)}
                  onRename={() => onFolderRename?.(folder)}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}

            {/* Render Files */}
            {fileItems.map((file) => (
              <motion.div
                key={`file-${file.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FileGridItem
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleDeleteRequest}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  onPreview={setPreviewFile}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
      <div className={`space-y-0 ${className}`}>
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_100px_100px_160px_40px] items-center gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-5" />
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Last Modified</span>
            <span />
          </div>
          <AnimatePresence>
            {/* Render Folders */}
            {folders.map((folder) => (
              <motion.div
                key={`folder-${folder.id}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FolderListItem
                  folder={folder}
                  onClick={() => onFolderClick?.(folder)}
                  onDelete={() => onFolderDelete?.(folder)}
                  onRename={() => onFolderRename?.(folder)}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}

            {/* Render Files */}
            {fileItems.map((file) => (
              <motion.div
                key={`file-${file.id}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FileListItem
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleDeleteRequest}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                  onPreview={setPreviewFile}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!fileToDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setFileToDelete(null)}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Share Modal */}
      {shareFile && shareLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Share File</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share link expires in 1 hour
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm"
              />
              <Button
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShareFile(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
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
  onPreview?: (file: FileWithActions) => void;
}

const FileGridItem: React.FC<FileItemProps> = ({
  file,
  onDownload,
  onDelete,
  getFileIcon,
  formatFileSize,
  formatDate,
  onPreview,
}) => {
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const isPreviewable = isImage || isVideo || isPdf;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Thumbnail or icon */}
    <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative overflow-hidden rounded-t-xl">
        <ImageThumbnailPreview 
          file={file} 
          fallbackIcon={getFileIcon(file)} 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); if (onPreview) onPreview(file); }}
            disabled={!isPreviewable}
            title={!isPreviewable ? "Preview not available for this file" : "Preview Content"}
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <Eye className="w-4 h-4" />
          </Button>
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
        <h4 className="font-medium text-sm text-foreground truncate mb-1" title={file.name}>
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <span>{formatDate(file.uploadDate)}</span>
        </div>
      </div>
    </Card>
  );
};

const FileListItem: React.FC<FileItemProps> = ({
  file,
  onDownload,
  onDelete,
  getFileIcon,
  formatFileSize,
  formatDate,
  onPreview,
}) => {
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const isPreviewable = isImage || isVideo || isPdf;
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="group hover:bg-secondary/50 transition-colors border-b border-border/60" style={{ padding: 0 }}>
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2">
        <div className="flex-shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
          <ImageThumbnailPreview 
            file={file} 
            fallbackIcon={getFileIcon(file)} 
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs sm:text-sm text-foreground truncate" title={file.name}>
            {file.name}
          </h4>
          <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(file.size)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(file.uploadDate)}
            </span>
          </div>
          <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
            {formatFileSize(file.size)}
          </div>
        </div>
        
        {/* Actions - Mobile Menu */}
        <div className="sm:hidden relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="h-7 w-7 p-0"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showActions && (
            <div className="absolute right-0 top-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-28">
              <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => { if (onPreview) onPreview(file); setShowActions(false); }}
                disabled={!isPreviewable}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => { onDownload(file); setShowActions(false); }}
                disabled={file.isDownloading || file.isDeleting}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => { onDelete(file); setShowActions(false); }}
                disabled={file.isDownloading || file.isDeleting}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        
        {/* Actions - Desktop */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); if (onPreview) onPreview(file); }}
            disabled={!isPreviewable}
            title={!isPreviewable ? "Preview not available" : "Preview Content"}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(file)}
            disabled={file.isDownloading || file.isDeleting}
            loading={file.isDownloading}
            className="h-8 w-8 p-0"
            title="Download"
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
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Authorized Thumbnail Fetcher
const ImageThumbnailPreview: React.FC<{ 
  file: FileWithActions, 
  fallbackIcon: React.ReactNode, 
  className?: string,
  active?: boolean 
}> = ({ file, fallbackIcon, className = "w-full h-full object-cover", active = false }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(file.thumbnail || null);
  const [hasError, setHasError] = useState(false);
  
  React.useEffect(() => {
    if (file.thumbnail) return;
    if (!active) return; // Prevent bandwidth drain until user clicks View
    
    
    let isMounted = true;
    let localUrl = '';
    
    // Only attempt to generate thumbnail for images smaller than 5MB
    if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
      const loadThumbnail = async () => {
        try {
          const cacheName = 'cloud-storage-thumbnails';
          const cacheUrl = `/api/v1/objects/${file.id}/download`;
          
          if ('caches' in window) {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(cacheUrl);
            if (cachedResponse && isMounted) {
              const blob = await cachedResponse.blob();
              localUrl = URL.createObjectURL(blob);
              setImgSrc(localUrl);
              return;
            }
          }

          const response = await axiosInstance.get(cacheUrl, {
            responseType: 'blob',
            timeout: 10000,
          });
          
          if (isMounted && response.data) {
            if ('caches' in window) {
              const cache = await caches.open(cacheName);
              const webResponse = new Response(response.data);
              await cache.put(cacheUrl, webResponse);
            }
            localUrl = URL.createObjectURL(response.data);
            setImgSrc(localUrl);
          }
        } catch (error) {
          if (isMounted) setHasError(true);
        }
      };
      
      loadThumbnail();
    } else {
      setHasError(true);
    }
    
    return () => {
      isMounted = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [file.id, file.type, file.size, file.thumbnail, active]); 
  
  if (imgSrc && !hasError) {
    return (
      <img
        src={imgSrc}
        alt={file.name}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }
  
  return (
    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
      <div className={className.includes('rounded-lg') ? "" : "text-4xl"}>
        {fallbackIcon}
      </div>
    </div>
  );
};

export default FileList;

// Folder Item Components
interface FolderItemProps {
  folder: FolderItem;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
  formatDate: (date: Date) => string;
}

const FolderGridItem: React.FC<FolderItemProps> = ({ folder, onClick, onDelete, onRename, formatDate }) => {
  return (
    <div
      className="bg-white border border-border rounded-xl group relative overflow-hidden hover:shadow-card-hover transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-blue-50/60 flex flex-col items-center justify-center relative overflow-hidden p-4">
        <Folder className="w-14 h-14 text-blue-500 mb-2" fill="currentColor" fillOpacity={0.2} />
        <h4 className="font-medium text-sm text-foreground truncate w-full text-center" title={folder.name}>
          {folder.name}
        </h4>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="bg-white/90 text-foreground hover:bg-white"
            title="Rename Folder"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="bg-red-500/90 text-white hover:bg-red-600"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FolderListItem: React.FC<FolderItemProps> = ({ folder, onClick, onDelete, onRename, formatDate }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="group hover:bg-secondary/50 transition-colors border-b border-border/60 cursor-pointer">
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2" onClick={onClick}>
        <div className="flex-shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-blue-50 rounded-lg flex items-center justify-center overflow-hidden">
          <Folder className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" fill="currentColor" fillOpacity={0.2} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs sm:text-sm text-foreground truncate" title={folder.name}>
            {folder.name}
          </h4>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
            <span>Folder</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(new Date(folder.created_at))}
            </span>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="h-7 w-7 p-0"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showActions && (
            <div className="absolute right-0 top-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-28">
              <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); onRename(); setShowActions(false); }}
              >
                <Pencil className="w-3.5 h-3.5" /> Rename
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); onDelete(); setShowActions(false); }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="h-8 w-8 p-0"
            title="Rename Folder"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};