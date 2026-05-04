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
  onUploadComplete?: () => void;
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
  abortController?: AbortController;
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

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB default

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = DEFAULT_ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
  multiple = true,
  onUpload,
  onUploadComplete,
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
      abortController: new AbortController(),
    }));

    setUploadingFiles(filesWithProgress);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const fileWithProgress of filesWithProgress) {
        const { file } = fileWithProgress;
        
        await uploadFile(file, {
          providerId: localProviderId,
          folderPath,
          abortController: fileWithProgress.abortController,
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
        if (onUploadComplete) {
          onUploadComplete();
        }
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

  // Remove or cancel file
  const handleRemoveOrCancel = useCallback((fileToRemove: File, abortController?: AbortController) => {
    if (abortController) {
      abortController.abort();
    }
    setUploadingFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main drop zone */}
      <div
        className={`
          relative overflow-hidden transition-all duration-300 ease-out cursor-pointer rounded-2xl
          border-2 border-dashed
          ${isDragOver 
            ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.15)]' 
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
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
                w-10 h-10 mx-auto transition-colors duration-300
                ${isDragOver ? 'text-primary' : 'text-muted-foreground/60'}
              `} 
            />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
            {isDragOver ? 'Drop files here' : 'Upload files'}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6 font-medium">
            Drag and drop files here, or click to browse
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground/70 font-medium">
            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">Max {formatFileSize(maxSize)}</span>
            {multiple && <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">Multiple files</span>}
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
      </div>

      {/* Provider Selector if "All Providers" is currently active globally */}
      {!providerId && providers && providers.length > 0 && (
        <div className="p-4 mt-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-xl text-sm shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-white/10">
          <label className="font-medium text-foreground whitespace-nowrap text-xs uppercase tracking-wider opacity-80">
            Destination Provider
          </label>
          <div className="relative flex-1">
            <select 
              value={localProviderId} 
              onChange={e => setLocalProviderId(e.target.value)}
              className="w-full appearance-none bg-transparent border-b border-white/20 py-2 pl-2 pr-8 text-sm font-medium focus:outline-none focus:border-primary transition-colors text-foreground cursor-pointer"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id} className="bg-neutral-900">{p.provider_name} {p.is_active ? '' : '(Inactive)'}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
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
            {uploadingFiles.map(({ file, progress, abortController }) => (
              <FileUploadItem
                key={progress.fileId}
                file={file}
                progress={progress}
                onRemove={() => handleRemoveOrCancel(file, abortController)}
                canRemove={progress.status === 'pending' || progress.status === 'error' || progress.status === 'uploading'}
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
  onRemove: () => void;
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Upload className="w-4 h-4 text-primary" /></motion.div>;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
      case 'error':
        return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      case 'uploading':
        return 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]';
      default:
        return 'bg-muted';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl transition-all hover:bg-white/10"
    >
      <div className="flex-shrink-0 p-2 bg-black/20 rounded-lg">
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-foreground truncate pr-4">
            {file.name}
          </p>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {formatFileSize(file.size)}
          </span>
        </div>
        
        {progress.status === 'error' && progress.error && (
          <p className="text-xs font-medium text-red-400 mb-2">{progress.error}</p>
        )}
        
        {(progress.status === 'uploading' || progress.status === 'pending') && (
          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getStatusColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}
        
        {progress.status === 'completed' && (
          <p className="text-xs font-medium text-green-400">Upload completed</p>
        )}
      </div>
      
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-60 hover:opacity-100"
          title={progress.status === 'uploading' ? 'Cancel Upload' : 'Remove'}
        >
          <X className="w-4 h-4" />
        </button>
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