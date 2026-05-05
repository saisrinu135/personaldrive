'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Upload, 
  FolderOpen, 
  Grid, 
  List, 
  Search,
  RefreshCw,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/base/Toast';
import { UploadModal } from './UploadModal';
import { FileList } from './FileList';

import { listFiles, deleteFile } from '@/services/file.service';
import { FileItem } from '@/types/file.types';
import { 
  FolderItem,
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
  /** Optional external search query (e.g. from global header search bar) */
  searchQuery?: string;
  className?: string;
}

/** Discriminated union — ensures delete always calls the right API */
export type ListItem =
  | { itemType: 'folder'; data: FolderItem }
  | { itemType: 'file';   data: FileItem };

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

export const FileManager: React.FC<FileManagerProps> = ({
  providerId,
  providers,
  searchQuery: externalSearch = '',
  className = '',
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; onClick?: () => void }[]>([]);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'rename'>('create');
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [localSearch, setLocalSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { addToast } = useToast();

  // Merge external (header) search with local search — external takes priority
  const activeSearch = externalSearch || localSearch;

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        listFiles({ providerId, folderId: currentFolderId || undefined }),
        listFolders(providerId, currentFolderId || undefined),
      ]);

      const fileItems: FileItem[] = filesRes.objects.map(file => ({
        id: String(file.id),
        name: file.filename,
        size: file.size_bytes,
        type: file.content_type || 'application/octet-stream',
        uploadDate: new Date(file.uploaded_at),
        folderPath: '',
      }));

      setFiles(fileItems);
      setFolders(foldersRes);

      if (currentFolderId) {
        const crumbs = await getFolderBreadcrumbs(currentFolderId);
        setBreadcrumbs([
          { label: 'Root', onClick: () => setCurrentFolderId(null) },
          ...crumbs.map(c => ({ label: c.name, onClick: () => setCurrentFolderId(c.id) })),
        ]);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load items',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [providerId, currentFolderId, addToast]);

  useEffect(() => {
    if (providerId) loadItems();
  }, [loadItems, providerId]);

  // ─── Filter + Sort (computed, no extra state) ─────────────────────────────

  const filteredFiles = useMemo(() => {
    const q = activeSearch.toLowerCase();
    let result = q ? files.filter(f => f.name.toLowerCase().includes(q)) : [...files];
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'size') cmp = a.size - b.size;
      else if (sortField === 'date') cmp = a.uploadDate.getTime() - b.uploadDate.getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [files, activeSearch, sortField, sortOrder]);

  const filteredFolders = useMemo(() => {
    const q = activeSearch.toLowerCase();
    let result = q ? folders.filter(f => f.name.toLowerCase().includes(q)) : [...folders];
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name); // folders always sort by name
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [folders, activeSearch, sortOrder]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => loadItems(), [loadItems]);

  const handleDeleteItem = useCallback(async (item: ListItem) => {
    try {
      if (item.itemType === 'file') {
        await deleteFile(item.data.id);
        addToast({ type: 'success', title: 'File deleted', message: `"${item.data.name}" deleted` });
      } else {
        await deleteFolder(item.data.id);
        addToast({ type: 'success', title: 'Folder deleted', message: `"${item.data.name}" deleted` });
      }
      await loadItems();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: err?.response?.data?.detail || err?.message || 'Delete failed',
      });
    }
  }, [loadItems, addToast]);

  const handleFolderSubmit = async (name: string) => {
    try {
      if (folderModalMode === 'create') {
        await createFolder(providerId, { name, parent_id: currentFolderId || undefined });
        addToast({ type: 'success', title: 'Folder created', message: `Created "${name}"` });
      } else if (folderModalMode === 'rename' && selectedFolder) {
        await updateFolder(selectedFolder.id, { name });
        addToast({ type: 'success', title: 'Folder renamed', message: `Renamed to "${name}"` });
      }
      await loadItems();
      setShowFolderModal(false);
    } catch (error) {
      addToast({ type: 'error', title: 'Operation failed', message: error instanceof Error ? error.message : 'Error' });
      throw error;
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const sortLabel: Record<SortField, string> = { name: 'Name', size: 'Size', date: 'Date' };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap px-3 sm:px-4 py-2.5 bg-white border-b border-border">
        {/* Left actions */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="h-8 px-2 sm:px-3 flex-shrink-0"
            title="Upload files"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Upload</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFolderModalMode('create'); setSelectedFolder(null); setShowFolderModal(true); }}
            className="h-8 px-2 sm:px-3 flex-shrink-0"
            title="Create new folder"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">New Folder</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || !providerId}
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Sort — desktop dropdown */}
          <div className="hidden sm:flex items-center gap-1">
            <select
              value={sortField}
              onChange={e => toggleSort(e.target.value as SortField)}
              className="h-8 px-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="date">Date</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 p-0"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* View toggle */}
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
            title="List view"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Breadcrumbs + local search ───────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 border-b border-border bg-white">
        <div className="min-w-0 flex-1 overflow-hidden">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Local search — only shown when no external search is active */}
        {!externalSearch && (
          <div className="relative hidden sm:block flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 w-36 pl-8 pr-7 rounded-md border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── File list ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <FileList
          files={filteredFiles}
          folders={filteredFolders}
          providerId={providerId}
          loading={loading}
          viewMode={viewMode}
          onRefresh={handleRefresh}
          onFolderClick={folder => setCurrentFolderId(folder.id)}
          onFolderRename={folder => {
            setFolderModalMode('rename');
            setSelectedFolder(folder);
            setShowFolderModal(true);
          }}
          onDeleteItem={handleDeleteItem}
          emptyMessage={activeSearch ? 'No files match your search' : 'This folder is empty'}
        />
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={() => { loadItems(); setShowUploadModal(false); }}
        providerId={providerId}
        providers={providers}
        folderId={currentFolderId || undefined}
      />

      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleFolderSubmit}
        initialName={folderModalMode === 'rename' ? selectedFolder?.name ?? '' : ''}
        title={folderModalMode === 'rename' ? 'Rename Folder' : 'Create New Folder'}
      />
    </div>
  );
};

export default FileManager;