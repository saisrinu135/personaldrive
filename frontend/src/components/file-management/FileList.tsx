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
  Share2,
  ExternalLink,
  Check,
  Folder,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/base/Toast';
import { FileItem } from '@/types/file.types';
import { downloadFile, getFileDirectLink, getFilePreviewUrl } from '@/services/file.service';
import { FilePreviewModal } from './FilePreviewModal';
import { FolderItem } from '@/services/folder.service';
import { ListItem } from './FileManager';

export interface FileListProps {
  files: FileItem[];
  onDownload?: (file: FileItem) => void;
  onRefresh?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  providerId: string;
  className?: string;
  viewMode?: 'grid' | 'list';
  folders?: FolderItem[];
  onFolderClick?: (folder: FolderItem) => void;
  onFolderRename?: (folder: FolderItem) => void;
  /** Unified delete handler — knows whether to call file or folder API */
  onDeleteItem?: (item: ListItem) => Promise<void>;
  // Legacy callback kept for compatibility (used by tests)
  onDelete?: (file: FileItem) => void;
  onFolderDelete?: (folder: FolderItem) => void;
}

interface FileWithActions extends FileItem {
  isDeleting?: boolean;
  isDownloading?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onDownload,
  onRefresh,
  loading = false,
  emptyMessage = 'No files found',
  providerId,
  className = '',
  viewMode = 'grid',
  folders = [],
  onFolderClick,
  onFolderRename,
  onDeleteItem,
  onDelete,
  onFolderDelete,
}) => {
  const [filesWithActions, setFilesWithActions] = useState<FileWithActions[]>([]);
  const [itemToDelete, setItemToDelete] = useState<ListItem | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: FileWithActions; url: string } | null>(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    setFilesWithActions(files.map(file => ({ ...file })));
  }, [files]);

  // ─── Download ───────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async (file: FileWithActions) => {
    if (file.isDownloading) return;
    setFilesWithActions(prev => prev.map(f => f.id === file.id ? { ...f, isDownloading: true } : f));
    try {
      if (onDownload) {
        await onDownload(file);
      } else {
        await downloadFile(file.id, file.name);
      }
      addToast({ type: 'success', title: 'Download started', message: file.name });
    } catch (error) {
      addToast({ type: 'error', title: 'Download failed', message: error instanceof Error ? error.message : 'Failed' });
    } finally {
      setFilesWithActions(prev => prev.map(f => f.id === file.id ? { ...f, isDownloading: false } : f));
    }
  }, [onDownload, addToast]);

  // ─── Open (view inline) — uses /preview (inline=True) ─────────────────────

  const handleOpen = useCallback(async (file: FileWithActions) => {
    try {
      const url = await getFilePreviewUrl(file.id);
      setPreviewFile({ file, url });
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to open file', message: error instanceof Error ? error.message : 'Error' });
    }
  }, [addToast]);

  // ─── Share (copy inline link to clipboard) — uses /preview (inline=True) ───

  const handleShare = useCallback(async (file: FileWithActions) => {
    try {
      const url = await getFilePreviewUrl(file.id);
      await navigator.clipboard.writeText(url);
      addToast({ type: 'success', title: 'Link copied', message: 'Shareable link copied to clipboard' });
    } catch (error) {
      addToast({ type: 'error', title: 'Share failed', message: error instanceof Error ? error.message : 'Failed to generate link' });
    }
  }, [addToast]);

  // ─── Delete (file or folder) ─────────────────────────────────────────────────

  const handleDeleteRequest = useCallback((item: ListItem) => {
    setItemToDelete(item);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!itemToDelete) return;
    const item = itemToDelete;
    setItemToDelete(null);

    if (item.itemType === 'file') {
      setFilesWithActions(prev => prev.map(f => f.id === item.data.id ? { ...f, isDeleting: true } : f));
    }

    try {
      if (onDeleteItem) {
        await onDeleteItem(item);
      } else if (item.itemType === 'file' && onDelete) {
        await onDelete(item.data);
      } else if (item.itemType === 'folder' && onFolderDelete) {
        await onFolderDelete(item.data);
      }
      if (item.itemType === 'file') {
        setFilesWithActions(prev => prev.filter(f => f.id !== item.data.id));
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      addToast({ type: 'error', title: 'Delete failed', message: error instanceof Error ? error.message : 'Failed' });
      if (item.itemType === 'file') {
        setFilesWithActions(prev => prev.map(f => f.id === item.data.id ? { ...f, isDeleting: false } : f));
      }
    }
  }, [itemToDelete, onDeleteItem, onDelete, onFolderDelete, onRefresh, addToast]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getFileIcon = useCallback((file: FileWithActions) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText className="w-5 h-5" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }, []);

  const fileItems = useMemo(() => filesWithActions, [filesWithActions]);

  // ─── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`space-y-2 p-3 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-border">
            <div className="w-9 h-9 bg-secondary rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────────────

  if (fileItems.length === 0 && folders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
          <File className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground">Upload some files to get started</p>
      </div>
    );
  }

  const deleteDialogName = itemToDelete
    ? (itemToDelete.itemType === 'file' ? itemToDelete.data.name : itemToDelete.data.name)
    : '';

  return (
    <>
      {viewMode === 'grid' ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 ${className}`}>
          <AnimatePresence>
            {folders.map(folder => (
              <motion.div key={`folder-${folder.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <FolderGridItem
                  folder={folder}
                  onClick={() => onFolderClick?.(folder)}
                  onDelete={() => handleDeleteRequest({ itemType: 'folder', data: folder })}
                  onRename={() => onFolderRename?.(folder)}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
            {fileItems.map(file => (
              <motion.div key={`file-${file.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <FileGridItem
                  file={file}
                  onDownload={handleDownload}
                  onDelete={() => handleDeleteRequest({ itemType: 'file', data: file })}
                  onOpen={handleOpen}
                  onShare={handleShare}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className={`space-y-0 ${className}`}>
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_80px_120px_40px] items-center gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="w-5" />
            <span>Name</span>
            <span>Size</span>
            <span>Modified</span>
            <span />
          </div>
          <AnimatePresence>
            {folders.map(folder => (
              <motion.div key={`folder-${folder.id}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <FolderListItem
                  folder={folder}
                  onClick={() => onFolderClick?.(folder)}
                  onDelete={() => handleDeleteRequest({ itemType: 'folder', data: folder })}
                  onRename={() => onFolderRename?.(folder)}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
            {fileItems.map(file => (
              <motion.div key={`file-${file.id}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <FileListItem
                  file={file}
                  onDownload={handleDownload}
                  onDelete={() => handleDeleteRequest({ itemType: 'file', data: file })}
                  onOpen={handleOpen}
                  onShare={handleShare}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={itemToDelete?.itemType === 'folder' ? 'Delete Folder' : 'Delete File'}
        message={`Are you sure you want to delete "${deleteDialogName}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <FilePreviewModal
        file={previewFile?.file ?? null}
        previewUrl={previewFile?.url}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
};

// ─── File Grid Item ───────────────────────────────────────────────────────────

interface FileItemProps {
  file: FileWithActions;
  onDownload: (file: FileWithActions) => void;
  onDelete: () => void;
  onOpen: (file: FileWithActions) => void;
  onShare: (file: FileWithActions) => void;
  getFileIcon: (file: FileWithActions) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  formatDate: (date: Date) => string;
}

const FileGridItem: React.FC<FileItemProps> = ({ file, onDownload, onDelete, onOpen, onShare, getFileIcon, formatFileSize, formatDate }) => (
  <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200">
    <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative overflow-hidden rounded-t-xl">
      <div className="text-muted-foreground/40 text-4xl">{getFileIcon(file)}</div>

      {/* Action overlay */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
        <ActionBtn title="Open" onClick={() => onOpen(file)} disabled={file.isDeleting}>
          <ExternalLink className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn title="Share — copy link" onClick={() => onShare(file)} disabled={file.isDeleting}>
          <Share2 className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn title="Download" onClick={() => onDownload(file)} disabled={file.isDownloading || file.isDeleting} loading={file.isDownloading}>
          <Download className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn title="Delete" onClick={onDelete} disabled={file.isDownloading || file.isDeleting} loading={file.isDeleting} danger>
          <Trash2 className="w-4 h-4" />
        </ActionBtn>
      </div>
    </div>

    <div className="p-3">
      <h4 className="font-medium text-sm text-foreground truncate mb-1" title={file.name}>{file.name}</h4>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatFileSize(file.size)}</span>
        <span>{formatDate(file.uploadDate)}</span>
      </div>
    </div>
  </Card>
);

// ─── File List Item ───────────────────────────────────────────────────────────

const FileListItem: React.FC<FileItemProps> = ({ file, onDownload, onDelete, onOpen, onShare, getFileIcon, formatFileSize, formatDate }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group hover:bg-secondary/50 transition-colors border-b border-border/60">
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2">
        <div className="flex-shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-slate-100 rounded-lg flex items-center justify-center text-muted-foreground">
          {getFileIcon(file)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs sm:text-sm text-foreground truncate" title={file.name}>{file.name}</h4>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatFileSize(file.size)}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(file.uploadDate)}</span>
          </div>
          <div className="sm:hidden text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</div>
        </div>

        {/* Mobile: three-dot menu */}
        <div className="sm:hidden relative">
          <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="h-7 w-7 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-border rounded-md shadow-lg z-20 min-w-[130px] py-1">
              <MobileMenuItem icon={<ExternalLink className="w-3.5 h-3.5" />} label="Open" onClick={() => { onOpen(file); setShowMenu(false); }} />
              <MobileMenuItem icon={<Share2 className="w-3.5 h-3.5" />} label="Share" onClick={() => { onShare(file); setShowMenu(false); }} />
              <MobileMenuItem icon={<Download className="w-3.5 h-3.5" />} label="Download" onClick={() => { onDownload(file); setShowMenu(false); }} disabled={file.isDownloading || file.isDeleting} />
              <MobileMenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={() => { onDelete(); setShowMenu(false); }} danger disabled={file.isDeleting} />
            </div>
          )}
        </div>

        {/* Desktop: icon buttons */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn title="Open" onClick={() => onOpen(file)}>
            <ExternalLink className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Share — copy link" onClick={() => onShare(file)}>
            <Share2 className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Download" onClick={() => onDownload(file)} disabled={file.isDownloading || file.isDeleting}>
            <Download className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Delete" onClick={onDelete} disabled={file.isDeleting} danger>
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
};

// ─── Folder Items ─────────────────────────────────────────────────────────────

interface FolderItemProps {
  folder: FolderItem;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
  formatDate: (date: Date) => string;
}

const FolderGridItem: React.FC<FolderItemProps> = ({ folder, onClick, onDelete, onRename, formatDate }) => (
  <div className="bg-white border border-border rounded-xl group relative overflow-hidden hover:shadow-card-hover transition-all duration-200 cursor-pointer" onClick={onClick}>
    <div className="aspect-[4/3] bg-blue-50/60 flex flex-col items-center justify-center relative overflow-hidden p-4">
      <Folder className="w-14 h-14 text-blue-500 mb-2" fill="currentColor" fillOpacity={0.2} />
      <h4 className="font-medium text-sm text-foreground truncate w-full text-center" title={folder.name}>{folder.name}</h4>

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
        <ActionBtn title="Rename" onClick={(e) => { e.stopPropagation(); onRename(); }}>
          <Pencil className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} danger>
          <Trash2 className="w-4 h-4" />
        </ActionBtn>
      </div>
    </div>
    <div className="px-3 py-2 text-xs text-muted-foreground">
      {formatDate(new Date(folder.created_at))}
    </div>
  </div>
);

const FolderListItem: React.FC<FolderItemProps> = ({ folder, onClick, onDelete, onRename, formatDate }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group hover:bg-secondary/50 transition-colors border-b border-border/60 cursor-pointer">
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2" onClick={onClick}>
        <div className="flex-shrink-0 w-8 sm:w-9 h-8 sm:h-9 bg-blue-50 rounded-lg flex items-center justify-center">
          <Folder className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" fill="currentColor" fillOpacity={0.2} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs sm:text-sm text-foreground truncate" title={folder.name}>{folder.name}</h4>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
            <span>Folder</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(new Date(folder.created_at))}</span>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden relative" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="h-7 w-7 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-border rounded-md shadow-lg z-20 min-w-[120px] py-1">
              <MobileMenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="Rename" onClick={() => { onRename(); setShowMenu(false); }} />
              <MobileMenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={() => { onDelete(); setShowMenu(false); }} danger />
            </div>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn title="Rename" onClick={(e) => { e.stopPropagation(); onRename(); }}>
            <Pencil className="w-4 h-4" />
          </IconBtn>
          <IconBtn title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} danger>
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
};

// ─── Reusable mini components ─────────────────────────────────────────────────

const ActionBtn: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, loading: _loading, danger, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg text-white transition-colors disabled:opacity-40 ${danger ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}
  >
    {children}
  </button>
);

const IconBtn: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, danger, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
      danger
        ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`}
  >
    {children}
  </button>
);

const MobileMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, danger, disabled }) => (
  <button
    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-secondary disabled:opacity-40 ${danger ? 'text-red-600' : 'text-foreground'}`}
    onClick={onClick}
    disabled={disabled}
  >
    {icon} {label}
  </button>
);

export default FileList;