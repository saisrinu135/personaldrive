'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/base/Toast';
import { uploadFile } from '@/services/file.service';
import { UploadProgress } from '@/types/file.types';
import { Provider } from '@/types/provider.types';

export interface FileUploaderProps {
  accept?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  onProgress?: (progress: UploadProgress) => void;
  disabled?: boolean;
  providerId: string;
  providers?: Provider[];
  folderPath?: string;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: UploadProgress;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB default

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = DEFAULT_ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
  multiple = true,
  onUpload,
  onProgress,
  disabled = false,
  providerId,
  providers,
  folderPath = '',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [localProviderId, setLocalProviderId] = useState<string>(
    providerId || (providers && providers.length > 0 ? providers[0].id : '')
  );
  
  // Keep local synced with global prop if it changes and isn't empty
  React.useEffect(() => {
    if (providerId) setLocalProviderId(providerId);
  }, [providerId]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }

    // Check file type
    if (accept.length > 0) {
      const isAccepted = accept.some(acceptedType => {
        if (acceptedType.endsWith('/*')) {
          const category = acceptedType.slice(0, -2);
          return file.type.startsWith(category);
        }
        return file.type === acceptedType;
      });

      if (!isAccepted) {
        return `File type "${file.type}" is not supported. Accepted types: ${accept.join(', ')}.`;
      }
    }

    return null;
  }, [accept, maxSize]);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => addToast({
        type: 'error',
        title: 'Validation Error',
        message: error,
      }));
    }

    if (validFiles.length === 0) return;

    // If custom onUpload handler is provided, use it
    if (onUpload) {
      try {
        setIsUploading(true);
        await onUpload(validFiles);
        addToast({
          type: 'success',
          title: 'Upload Successful',
          message: `Successfully uploaded ${validFiles.length} file(s)`,
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: error instanceof Error ? error.message : 'Upload failed',
        });
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Default upload handling
    setIsUploading(true);
    const filesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: {
        fileId: `${Date.now()}-${file.name}`,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      },
    }));

    setUploadingFiles(filesWithProgress);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const fileWithProgress of filesWithProgress) {
        const { file } = fileWithProgress;
        
        await uploadFile(file, {
          providerId: localProviderId,
          folderPath,
          onProgress: (progress) => {
            // Update progress for this specific file
            setUploadingFiles(prev => 
              prev.map(f => 
                f.file === file 
                  ? { ...f, progress }
                  : f
              )
            );
            
            // Call external progress handler if provided
            if (onProgress) {
              onProgress(progress);
            }
          },
        });
      }

      addToast({
        type: 'success',
        title: 'Upload Successful',
        message: `Successfully uploaded ${validFiles.length} file(s)`,
      });
      
      // Clear uploading files after a delay to show completion
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
      
      // Mark failed uploads
      setUploadingFiles(prev => 
        prev.map(f => ({
          ...f,
          progress: {
            ...f.progress,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          },
        }))
      );
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, validateFile, onUpload, localProviderId, folderPath, onProgress, addToast]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, isUploading, handleFiles]);

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  // Remove file from upload queue
  const removeFile = useCallback((fileToRemove: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main drop zone */}
      <Card
        className={`
          relative overflow-hidden transition-all duration-200 cursor-pointer
          ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-dashed border-gray-300 dark:border-gray-600'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mb-4"
          >
            <Upload 
              className={`
                w-12 h-12 mx-auto
                ${isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}
              `} 
            />
          </motion.div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {isDragOver ? 'Drop files here' : 'Upload files'}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Drag and drop files here, or click to select files
          </p>
          
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>Maximum file size: {formatFileSize(maxSize)}</p>
            {accept.length > 0 && (
              <p>Accepted types: {accept.join(', ')}</p>
            )}
            {multiple && <p>Multiple files supported</p>}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </Card>

      {/* Provider Selector if "All Providers" is currently active globally */}
      {!providerId && providers && providers.length > 0 && (
        <div className="p-4 mt-2 border border-border bg-card rounded-xl text-sm shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="font-semibold text-foreground whitespace-nowrap">
            Destination:
          </label>
          <select 
            value={localProviderId} 
            onChange={e => setLocalProviderId(e.target.value)}
            className="flex-1 w-full p-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.provider_name} {p.is_active ? '' : '(Inactive)'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Upload progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map(({ file, progress }) => (
              <FileUploadItem
                key={progress.fileId}
                file={file}
                progress={progress}
                onRemove={removeFile}
                canRemove={progress.status === 'pending' || progress.status === 'error'}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// File upload progress item component
interface FileUploadItemProps {
  file: File;
  progress: UploadProgress;
  onRemove: (file: File) => void;
  canRemove: boolean;
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  file,
  progress,
  onRemove,
  canRemove,
}) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </span>
        </div>
        
        {progress.status === 'error' && progress.error && (
          <p className="text-xs text-red-500 mb-2">{progress.error}</p>
        )}
        
        {(progress.status === 'uploading' || progress.status === 'pending') && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${getStatusColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        {progress.status === 'completed' && (
          <p className="text-xs text-green-600 dark:text-green-400">Upload completed</p>
        )}
      </div>
      
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file);
          }}
          className="p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUploader;