'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Move, 
  FolderOpen, 
  File as FileIcon, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/base/Toast';
import { FileItem, FolderItem } from '@/types/file.types';
import { moveFile } from '@/services/file.service';

export interface FileOrganizerProps {
  files: FileItem[];
  folders: FolderItem[];
  currentPath: string;
  providerId: string;
  onFileMove?: (fileId: string, newFolderPath: string) => Promise<void>;
  onRefresh?: () => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  draggedFileId: string | null;
  draggedFileName: string | null;
  dropTargetPath: string | null;
}

interface MoveOperation {
  fileId: string;
  fileName: string;
  fromPath: string;
  toPath: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export const FileOrganizer: React.FC<FileOrganizerProps> = ({
  files,
  folders,
  currentPath,
  providerId,
  onFileMove,
  onRefresh,
  className = '',
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFileId: null,
    draggedFileName: null,
    dropTargetPath: null,
  });
  const [moveOperations, setMoveOperations] = useState<MoveOperation[]>([]);
  const dragCounter = useRef(0);
  const { addToast } = useToast();

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, file: FileItem) => {
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'move';
    
    setDragState({
      isDragging: true,
      draggedFileId: file.id,
      draggedFileName: file.name,
      dropTargetPath: null,
    });
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedFileId: null,
      draggedFileName: null,
      dropTargetPath: null,
    });
    dragCounter.current = 0;
  }, []);

  // Handle drag enter on folder
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>, folderPath: string) => {
    e.preventDefault();
    dragCounter.current++;
    
    if (dragState.isDragging && dragState.draggedFileId) {
      setDragState(prev => ({
        ...prev,
        dropTargetPath: folderPath,
      }));
    }
  }, [dragState.isDragging, dragState.draggedFileId]);

  // Handle drag leave on folder
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        dropTargetPath: null,
      }));
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop on folder
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetFolderPath: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    const fileId = e.dataTransfer.getData('text/plain');
    const draggedFile = files.find(f => f.id === fileId);
    
    if (!draggedFile || !dragState.isDragging) {
      setDragState({
        isDragging: false,
        draggedFileId: null,
        draggedFileName: null,
        dropTargetPath: null,
      });
      return;
    }

    // Don't move to the same folder
    if (draggedFile.folderPath === targetFolderPath) {
      setDragState({
        isDragging: false,
        draggedFileId: null,
        draggedFileName: null,
        dropTargetPath: null,
      });
      return;
    }

    // Create move operation
    const moveOperation: MoveOperation = {
      fileId: draggedFile.id,
      fileName: draggedFile.name,
      fromPath: draggedFile.folderPath || '',
      toPath: targetFolderPath,
      status: 'pending',
    };

    setMoveOperations(prev => [...prev, moveOperation]);

    try {
      if (onFileMove) {
        await onFileMove(draggedFile.id, targetFolderPath);
      } else {
        await moveFile(draggedFile.id, targetFolderPath, providerId);
      }

      // Update operation status
      setMoveOperations(prev => 
        prev.map(op => 
          op.fileId === draggedFile.id && op.toPath === targetFolderPath
            ? { ...op, status: 'success' }
            : op
        )
      );

      addToast({
        type: 'success',
        title: 'File moved',
        message: `"${draggedFile.name}" moved to ${targetFolderPath || 'root folder'}`,
      });

      if (onRefresh) {
        onRefresh();
      }

      // Remove operation after delay
      setTimeout(() => {
        setMoveOperations(prev => 
          prev.filter(op => !(op.fileId === draggedFile.id && op.toPath === targetFolderPath))
        );
      }, 3000);

    } catch (error) {
      // Update operation status
      setMoveOperations(prev => 
        prev.map(op => 
          op.fileId === draggedFile.id && op.toPath === targetFolderPath
            ? { 
                ...op, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Move failed'
              }
            : op
        )
      );

      addToast({
        type: 'error',
        title: 'Move failed',
        message: error instanceof Error ? error.message : 'Failed to move file',
      });
    } finally {
      setDragState({
        isDragging: false,
        draggedFileId: null,
        draggedFileName: null,
        dropTargetPath: null,
      });
    }
  }, [files, dragState.isDragging, onFileMove, providerId, addToast, onRefresh]);

  // Remove move operation
  const removeMoveOperation = useCallback((fileId: string, toPath: string) => {
    setMoveOperations(prev => 
      prev.filter(op => !(op.fileId === fileId && op.toPath === toPath))
    );
  }, []);

  // Get folder display name
  const getFolderDisplayName = useCallback((folderPath: string): string => {
    if (!folderPath) return 'Root';
    const segments = folderPath.split('/');
    return segments[segments.length - 1];
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Move operations status */}
      <AnimatePresence>
        {moveOperations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {moveOperations.map((operation) => (
              <MoveOperationItem
                key={`${operation.fileId}-${operation.toPath}`}
                operation={operation}
                onRemove={removeMoveOperation}
                getFolderDisplayName={getFolderDisplayName}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag and drop area */}
      {dragState.isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-20 z-50 pointer-events-none"
        >
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <Card className="p-3 bg-blue-500 text-white shadow-lg">
              <div className="flex items-center space-x-2">
                <Move className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Moving "{dragState.draggedFileName}"
                </span>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Draggable files */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Files (drag to organize)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
            <DraggableFileItem
              key={file.id}
              file={file}
              isDragging={dragState.draggedFileId === file.id}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Drop target folders */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Folders (drop files here)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Root folder option */}
          {currentPath !== '' && (
            <DropTargetFolder
              folder={{
                id: 'root',
                name: 'Root',
                path: '',
                createdDate: new Date(),
                modifiedDate: new Date(),
                fileCount: 0,
                totalSize: 0,
              }}
              isDropTarget={dragState.dropTargetPath === ''}
              isDragActive={dragState.isDragging}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}
          
          {/* Regular folders */}
          {folders.map((folder) => (
            <DropTargetFolder
              key={folder.id}
              folder={folder}
              isDropTarget={dragState.dropTargetPath === folder.path}
              isDragActive={dragState.isDragging}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {files.length === 0 && folders.length === 0 && (
        <Card className="text-center py-8">
          <Move className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No files or folders to organize
          </p>
        </Card>
      )}
    </div>
  );
};

// Draggable file item component
interface DraggableFileItemProps {
  file: FileItem;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, file: FileItem) => void;
  onDragEnd: () => void;
}

const DraggableFileItem: React.FC<DraggableFileItemProps> = ({
  file,
  isDragging,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <motion.div
      animate={isDragging ? { scale: 0.95, opacity: 0.7 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`
          p-3 cursor-move transition-all duration-200 rounded-lg border bg-card text-card-foreground shadow-sm
          ${isDragging ? 'shadow-lg border-blue-500' : 'hover:shadow-md'}
        `}
        draggable
        onDragStart={(e) => onDragStart(e, file)}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center space-x-3">
          <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Move className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
};

// Drop target folder component
interface DropTargetFolderProps {
  folder: FolderItem;
  isDropTarget: boolean;
  isDragActive: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, folderPath: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, folderPath: string) => void;
}

const DropTargetFolder: React.FC<DropTargetFolderProps> = ({
  folder,
  isDropTarget,
  isDragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}) => {
  return (
    <motion.div
      animate={
        isDropTarget
          ? { scale: 1.05, borderColor: '#3b82f6' }
          : { scale: 1, borderColor: 'transparent' }
      }
      transition={{ duration: 0.2 }}
    >
      <div
        className={`
          p-4 transition-all duration-200 border-2 border-dashed rounded-lg bg-card text-card-foreground shadow-sm
          ${isDropTarget 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${isDragActive ? 'cursor-copy' : 'cursor-default'}
        `}
        onDragEnter={(e) => onDragEnter(e, folder.path)}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, folder.path)}
      >
        <div className="flex items-center space-x-3">
          <FolderOpen 
            className={`
              w-6 h-6 flex-shrink-0
              ${isDropTarget ? 'text-blue-500' : 'text-gray-400'}
            `} 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {folder.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {folder.fileCount} files
            </p>
          </div>
        </div>
        
        {isDropTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 text-center"
          >
            Drop file here
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Move operation status item
interface MoveOperationItemProps {
  operation: MoveOperation;
  onRemove: (fileId: string, toPath: string) => void;
  getFolderDisplayName: (path: string) => string;
}

const MoveOperationItem: React.FC<MoveOperationItemProps> = ({
  operation,
  onRemove,
  getFolderDisplayName,
}) => {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Move className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (operation.status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()}`}
    >
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {operation.fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {operation.status === 'pending' && 'Moving to '}
            {operation.status === 'success' && 'Moved to '}
            {operation.status === 'error' && 'Failed to move to '}
            {getFolderDisplayName(operation.toPath)}
          </p>
          {operation.error && (
            <p className="text-xs text-red-500 mt-1">{operation.error}</p>
          )}
        </div>
      </div>
      
      {operation.status !== 'pending' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(operation.fileId, operation.toPath)}
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

export default FileOrganizer;