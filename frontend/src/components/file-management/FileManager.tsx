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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/base/Toast';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';

import { 
  listFiles,
} from '@/services/file.service';
import { FileItem } from '@/types/file.types';
import { 
  FolderItem,
  BreadcrumbItem as FolderBreadcrumbItem,
  listFolders, 
  createFolder, 
  updateFolder, 
  deleteFolder,
  getFolderBreadcrumbs
} from '@/services/folder.service';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { FolderModal } from './FolderModal';
import { Provider } from '@/types/provider.types';

export interface FileManagerProps {
  providerId: string;
  providers?: Provider[];
  initialPath?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export const FileManager: React.FC<FileManagerProps> = ({
  providerId,
  providers,
  initialPath = '',
  className = '',
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; onClick?: () => void }[]>([]);
  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create');
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const { addToast } = useToast();

  // Load all items (files and folders)
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        listFiles({ providerId, folderId: currentFolderId || undefined }),
        listFolders(providerId, currentFolderId || undefined)
      ]);
      
      // Convert API response to FileItem format
      const fileItems: FileItem[] = filesRes.objects.map(file => ({
        id: String(file.id),
        name: file.filename,
        size: file.size_bytes,
        type: file.content_type || 'application/octet-stream',
        uploadDate: new Date(file.uploaded_at),
        folderPath: '',
      }));

      setFiles(fileItems);
      setFilteredFiles(fileItems);
      setFolders(foldersRes);
      setFilteredFolders(foldersRes);

      if (currentFolderId) {
        const crumbs = await getFolderBreadcrumbs(currentFolderId);
        // Transform folder breadcrumbs to component breadcrumbs
        const transformedCrumbs = [
          { label: 'Root', onClick: () => setCurrentFolderId(null) },
          ...crumbs.map((crumb) => ({
            label: crumb.name,
            onClick: () => setCurrentFolderId(crumb.id)
          }))
        ];
        setBreadcrumbs(transformedCrumbs);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load items',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, [providerId, currentFolderId, addToast]);

  // Initial load
  useEffect(() => {
    if (providerId) loadItems();
  }, [loadItems, providerId]);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
      setFilteredFolders(folders);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredFiles(files.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)));
      setFilteredFolders(folders.filter(f => f.name.toLowerCase().includes(q)));
    }
  }, [files, folders, searchQuery]);

  // Handle search results from FileSearch component
  const handleSearchResults = useCallback((results: FileItem[]) => {
    setSearchResults(results);
    setFilteredFiles(results);
    // When searching globally, we usually only show files or have a separate endpoint for searching both.
    // For now we'll just clear folders if there's an active global search result set
    if (results.length > 0) setFilteredFolders([]);
  }, []);

  const handleUploadComplete = useCallback(async () => {
    await loadItems();
    setShowUploader(false);
  }, [loadItems]);

  const handleRefresh = useCallback(() => {
    loadItems();
  }, [loadItems]);

  const handleFolderSubmit = async (name: string) => {
    try {
      if (folderModalMode === 'create') {
        await createFolder(providerId, { name, parent_id: currentFolderId || undefined });
        addToast({ type: 'success', title: 'Folder created', message: `Created folder "${name}"` });
      } else if (folderModalMode === 'rename' && selectedFolder) {
        await updateFolder(selectedFolder.id, { name });
        addToast({ type: 'success', title: 'Folder renamed', message: `Renamed folder to "${name}"` });
      }
      await loadItems();
      setShowFolderModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast({ 
        type: 'error', 
        title: folderModalMode === 'rename' ? 'Failed to rename folder' : 'Failed to create folder', 
        message: errorMessage 
      });
      throw error; // Re-throw so FolderModal can handle it
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? This action cannot be undone.`)) {
      try {
        await deleteFolder(folder.id);
        addToast({ type: 'success', title: 'Folder deleted', message: `Deleted folder "${folder.name}"` });
        await loadItems();
      } catch (err: any) {
        addToast({ type: 'error', title: 'Failed to delete folder', message: err.message || 'Unknown error' });
      }
    }
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-1.5 px-2 sm:px-5 py-2 sm:py-3 bg-white border-b border-border overflow-x-auto">
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowUploader(!showUploader)}
            icon={<Upload className="w-4 h-4" />}
            className="sm:px-3 px-1.5 h-8"
            title="Upload files"
          >
            <span className="hidden sm:inline ml-1">Upload</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFolderModalMode('create');
              setSelectedFolder(null);
              setShowFolderModal(true);
            }}
            icon={<FolderOpen className="w-4 h-4" />}
            className="sm:px-3 px-1.5 h-8"
            title="Create new folder"
          >
            <span className="hidden sm:inline ml-1">+ New</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || !providerId}
            className="p-1.5 h-8 w-8 flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            <div className="bg-white border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Upload Files</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUploader(false)}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <FileUploader 
                providerId={providerId}
                providers={providers}
                folderId={currentFolderId || undefined}
                onUploadComplete={handleUploadComplete} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-0 min-h-[400px] bg-white rounded-lg sm:rounded-xl border border-border overflow-hidden">
          {/* Breadcrumbs + View controls row */}
          <div className="flex items-center justify-between gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 border-b border-border overflow-x-auto">
            <div className="hidden sm:block flex-shrink-0">
              <Breadcrumbs 
                items={breadcrumbs} 
              />
            </div>

            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              {/* Search inline - hidden on mobile */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-8 w-40 pl-8 pr-3 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-1.5 h-8 w-8 flex-shrink-0"
                title="List view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-1.5 h-8 w-8 flex-shrink-0"
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* File list */}
          <FileList
            files={filteredFiles}
            folders={filteredFolders}
            providerId={providerId}
            loading={loading}
            viewMode={viewMode}
            onRefresh={handleRefresh}
            onFolderClick={(folder) => setCurrentFolderId(folder.id)}
            onFolderDelete={handleDeleteFolder}
            onFolderRename={(folder) => {
              setFolderModalMode('rename');
              setSelectedFolder(folder);
              setShowFolderModal(true);
            }}
            emptyMessage={
              searchQuery
                ? 'No files found matching your search'
                : 'This folder is empty'
            }
          />
      </div>

      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleFolderSubmit}
        initialName={folderModalMode === 'rename' ? selectedFolder?.name || '' : ''}
        title={folderModalMode === 'rename' ? 'Rename Folder' : 'Create New Folder'}
      />
    </div>
  );
};

export default FileManager;