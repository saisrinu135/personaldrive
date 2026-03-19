'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderPlus, 
  Edit3, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/base/Toast';
import { FolderItem } from '@/types/file.types';
import { createFolder, renameFolder, deleteFolder } from '@/services/file.service';

export interface FolderManagerProps {
  folders: FolderItem[];
  currentPath: string;
  providerId: string;
  onFolderClick: (folderPath: string) => void;
  onFolderCreate?: (folderPath: string, folderName: string) => Promise<void>;
  onFolderRename?: (oldPath: string, newName: string) => Promise<void>;
  onFolderDelete?: (folderPath: string) => Promise<void>;
  onRefresh?: () => void;
  className?: string;
}

interface FolderWithActions extends FolderItem {
  isRenaming?: boolean;
  isDeleting?: boolean;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  currentPath,
  providerId,
  onFolderClick,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onRefresh,
  className = '',
}) => {
  const [foldersWithActions, setFoldersWithActions] = useState<FolderWithActions[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { addToast } = useToast();

  // Update folders with actions when folders prop changes
  React.useEffect(() => {
    setFoldersWithActions(folders.map(folder => ({ ...folder })));
  }, [folders]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      addToast({
        type: 'error',
        title: 'Invalid folder name',
        message: 'Folder name cannot be empty',
      });
      return;
    }

    try {
      if (onFolderCreate) {
        await onFolderCreate(currentPath, newFolderName.trim());
      } else {
        await createFolder(currentPath, newFolderName.trim(), providerId);
      }

      addToast({
        type: 'success',
        title: 'Folder created',
        message: `Folder "${newFolderName}" has been created`,
      });

      setNewFolderName('');
      setIsCreatingFolder(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to create folder',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [newFolderName, currentPath, providerId, onFolderCreate, onRefresh, addToast]);

  // Handle folder rename
  const handleRenameFolder = useCallback(async (folder: FolderWithActions) => {
    if (!renameValue.trim()) {
      addToast({
        type: 'error',
        title: 'Invalid folder name',
        message: 'Folder name cannot be empty',
      });
      return;
    }

    if (renameValue.trim() === folder.name) {
      setRenamingFolderId(null);
      setRenameValue('');
      return;
    }

    try {
      // Update folder state to show renaming
      setFoldersWithActions(prev => 
        prev.map(f => 
          f.id === folder.id 
            ? { ...f, isRenaming: true }
            : f
        )
      );

      if (onFolderRename) {
        await onFolderRename(folder.path, renameValue.trim());
      } else {
        await renameFolder(folder.path, renameValue.trim(), providerId);
      }

      addToast({
        type: 'success',
        title: 'Folder renamed',
        message: `Folder renamed to "${renameValue}"`,
      });

      setRenamingFolderId(null);
      setRenameValue('');

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to rename folder',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      // Reset renaming state
      setFoldersWithActions(prev => 
        prev.map(f => 
          f.id === folder.id 
            ? { ...f, isRenaming: false }
            : f
        )
      );
    }
  }, [renameValue, providerId, onFolderRename, onRefresh, addToast]);

  // Handle folder deletion
  const handleDeleteFolder = useCallback(async (folder: FolderWithActions) => {
    // Confirm deletion
    const confirmMessage = folder.fileCount > 0 
      ? `Are you sure you want to delete "${folder.name}" and all ${folder.fileCount} files inside it?`
      : `Are you sure you want to delete the folder "${folder.name}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Update folder state to show deleting
      setFoldersWithActions(prev => 
        prev.map(f => 
          f.id === folder.id 
            ? { ...f, isDeleting: true }
            : f
        )
      );

      if (onFolderDelete) {
        await onFolderDelete(folder.path);
      } else {
        await deleteFolder(folder.path, providerId);
      }

      addToast({
        type: 'success',
        title: 'Folder deleted',
        message: `Folder "${folder.name}" has been deleted`,
      });

      // Remove folder from local state
      setFoldersWithActions(prev => prev.filter(f => f.id !== folder.id));

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to delete folder',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      
      // Reset deleting state on error
      setFoldersWithActions(prev => 
        prev.map(f => 
          f.id === folder.id 
            ? { ...f, isDeleting: false }
            : f
        )
      );
    }
  }, [providerId, onFolderDelete, onRefresh, addToast]);

  // Start renaming a folder
  const startRename = useCallback((folder: FolderWithActions) => {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  }, []);

  // Cancel rename
  const cancelRename = useCallback(() => {
    setRenamingFolderId(null);
    setRenameValue('');
  }, []);

  // Format file count
  const formatFileCount = useCallback((count: number): string => {
    if (count === 0) return 'Empty';
    if (count === 1) return '1 file';
    return `${count} files`;
  }, []);

  // Format folder size
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Create folder section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Folders
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreatingFolder(true)}
          icon={<FolderPlus className="w-4 h-4" />}
        >
          New Folder
        </Button>
      </div>

      {/* New folder creation */}
      <AnimatePresence>
        {isCreatingFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Folder className="w-5 h-5 text-blue-500" />
                <Input
                  type="text"
                  label=""
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    } else if (e.key === 'Escape') {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folders list */}
      {foldersWithActions.length === 0 ? (
        <Card className="text-center py-8">
          <Folder className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No folders in this location
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {foldersWithActions.map((folder) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FolderCard
                  folder={folder}
                  isRenaming={renamingFolderId === folder.id}
                  renameValue={renameValue}
                  onRenameValueChange={(e) => setRenameValue(e.target.value)}
                  onFolderClick={onFolderClick}
                  onStartRename={startRename}
                  onConfirmRename={handleRenameFolder}
                  onCancelRename={cancelRename}
                  onDelete={handleDeleteFolder}
                  formatFileCount={formatFileCount}
                  formatSize={formatSize}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Folder card component
interface FolderCardProps {
  folder: FolderWithActions;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderClick: (folderPath: string) => void;
  onStartRename: (folder: FolderWithActions) => void;
  onConfirmRename: (folder: FolderWithActions) => void;
  onCancelRename: () => void;
  onDelete: (folder: FolderWithActions) => void;
  formatFileCount: (count: number) => string;
  formatSize: (bytes: number) => string;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onFolderClick,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDelete,
  formatFileCount,
  formatSize,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => !isRenaming && onFolderClick(folder.path)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Folder icon and content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Folder className="w-8 h-8 text-blue-500 flex-shrink-0" />
          
          {/* Actions dropdown */}
          <AnimatePresence>
            {showActions && !isRenaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartRename(folder)}
                  disabled={folder.isRenaming || folder.isDeleting}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(folder)}
                  disabled={folder.isRenaming || folder.isDeleting}
                  loading={folder.isDeleting}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Folder name */}
        {isRenaming ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Input
              type="text"
              label=""
              value={renameValue}
              onChange={onRenameValueChange}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onConfirmRename(folder);
                } else if (e.key === 'Escape') {
                  onCancelRename();
                }
              }}
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onConfirmRename(folder)}
                disabled={!renameValue.trim() || folder.isRenaming}
                loading={folder.isRenaming}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelRename}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate mb-2" title={folder.name}>
              {folder.name}
            </h4>
            
            {/* Folder info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>{formatFileCount(folder.fileCount)}</div>
              {folder.totalSize > 0 && (
                <div>{formatSize(folder.totalSize)}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation indicator */}
      {!isRenaming && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </Card>
  );
};

export default FolderManager;