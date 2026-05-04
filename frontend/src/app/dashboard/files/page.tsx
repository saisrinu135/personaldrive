'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Upload, 
  Download, 
  Share2, 
  Copy, 
  MoreHorizontal,
  Filter,
  Grid3X3,
  List,
  Search,
  FolderPlus,
  File,
  Folder,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { FolderModal } from '@/components/file-management/FolderModal';
import { listFiles, toFileMetadata } from '@/services/file.service';
import { listFolders, createFolder, deleteFolder, getFolderBreadcrumbs, FolderItem, BreadcrumbItem } from '@/services/folder.service';
import { listProviders } from '@/services/provider.service';
import { FileMetadata } from '@/types/file.types';
import { Provider } from '@/types/provider.types';
import { useDashboard } from '../layout';

// Memoized file list component to prevent re-renders when breadcrumbs change
const FileListContent = memo<{
  allItems: any[];
  viewMode: 'grid' | 'list';
  handleFolderClick: (folder: FolderItem) => void;
  handleDeleteFolder: (folderId: string) => void;
  setSelectedItem: (itemId: string) => void;
  formatBytes: (bytes: number) => string;
  getFileIcon: (contentType: string) => string;
}>(({ allItems, viewMode, handleFolderClick, handleDeleteFolder, setSelectedItem, formatBytes, getFileIcon }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMenuToggle = useCallback((itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  }, [openMenuId]);

  const handleMenuAction = useCallback((action: string, itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setOpenMenuId(null);
    
    switch (action) {
      case 'delete':
        handleDeleteFolder(itemId);
        break;
      case 'rename':
        // TODO: Implement rename functionality
        console.log('Rename:', itemId);
        break;
      case 'download':
        // TODO: Implement download functionality
        console.log('Download:', itemId);
        break;
      default:
        setSelectedItem(itemId);
    }
  }, [handleDeleteFolder, setSelectedItem, openMenuId]);
  if (viewMode === 'list') {
    return (
      <div className="p-6">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Last Modified</div>
        </div>

        {/* File rows */}
        <div className="space-y-1 mt-2">
          {allItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer group"
              onClick={() => {
                if (item.type === 'folder') {
                  handleFolderClick(item as FolderItem);
                }
              }}
            >
              <div className="col-span-6 flex items-center space-x-3">
                {item.type === 'folder' ? (
                  <Folder className="w-5 h-5 text-blue-500" />
                ) : (
                  <span className="text-lg">{getFileIcon((item as FileMetadata).type)}</span>
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </span>
              </div>
              <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                {item.type === 'folder' ? 'Folder' : ((item as FileMetadata).type || 'File')}
              </div>
              <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                {item.type === 'folder' ? '-' : formatBytes((item as FileMetadata).size || 0)}
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.type === 'folder' 
                    ? new Date((item as FolderItem).updated_at).toLocaleDateString()
                    : (item as FileMetadata).lastModified?.toLocaleDateString() || 'Unknown'
                  }
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMenuToggle(item.id, e)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-32">
                        <div className="py-1">
                          {item.type === 'folder' ? (
                            <>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={(e) => handleMenuAction('rename', item.id, e)}
                              >
                                Rename
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={(e) => handleMenuAction('delete', item.id, e)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={(e) => handleMenuAction('download', item.id, e)}
                              >
                                Download
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={(e) => handleMenuAction('rename', item.id, e)}
                              >
                                Rename
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={(e) => handleMenuAction('delete', item.id, e)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {allItems.map((item) => (
        <Card
          key={item.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            if (item.type === 'folder') {
              handleFolderClick(item as FolderItem);
            }
          }}
        >
          <div className="text-center">
            {item.type === 'folder' ? (
              <Folder className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            ) : (
              <div className="text-4xl mb-2">{getFileIcon((item as FileMetadata).type)}</div>
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {item.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.type === 'folder' 
                ? 'Folder'
                : formatBytes((item as FileMetadata).size || 0)
              }
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
});

FileListContent.displayName = 'FileListContent';

export default function FilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchQuery, selectedProvider: selectedProviderId, providers } = useDashboard();
  
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Get folder path from URL
  const folderPath = searchParams.get('folder') || '';
  const providerParam = searchParams.get('provider') || '';

  // Helper function to update URL with folder path
  const updateURL = useCallback((folderId: string | null, folderPath: string = '') => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (folderPath) {
      params.set('folder', folderPath);
    } else {
      params.delete('folder');
    }
    
    if (selectedProvider) {
      params.set('provider', selectedProvider.id);
    }
    
    const newUrl = `/dashboard/files${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams, selectedProvider]);

  // Helper function to build folder path from breadcrumbs
  const buildFolderPath = useCallback((breadcrumbList: BreadcrumbItem[]) => {
    return breadcrumbList.map(b => b.name).join('/');
  }, []);

  // Set selected provider when dashboard context changes
  useEffect(() => {
    if (selectedProviderId && providers.length > 0) {
      const provider = providers.find(p => p.id === selectedProviderId);
      setSelectedProvider(provider || null);
    }
  }, [selectedProviderId, providers]);

  // Load providers on mount (remove this since we get them from context)
  // useEffect(() => {
  //   const fetchProviders = async () => {
  //     try {
  //       console.log('Fetching providers...');
  //       const providerList = await listProviders();
  //       console.log('Providers loaded:', providerList);
  //       setProviders(providerList);
  //       if (providerList.length > 0) {
  //         console.log('Setting selected provider:', providerList[0]);
  //         setSelectedProvider(providerList[0]);
  //       } else {
  //         console.log('No providers found');
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch providers:', error);
  //     }
  //   };
  //   fetchProviders();
  // }, []);

  // Load files and folders when provider or folder changes
  useEffect(() => {
    console.log('Effect triggered - selectedProvider:', selectedProvider, 'currentFolderId:', currentFolderId);
    if (!selectedProvider) {
      console.log('No selected provider, skipping data fetch');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Starting data fetch for provider:', selectedProvider.id);
        setLoading(true);
        
        // Fetch folders
        console.log('Calling listFolders with:', selectedProvider.id, currentFolderId || undefined);
        const folderList = await listFolders(selectedProvider.id, currentFolderId || undefined);
        console.log('Raw folders API response:', folderList);
        console.log('Number of folders returned:', folderList.length);
        folderList.forEach((folder, index) => {
          console.log(`Folder ${index + 1}:`, {
            id: folder.id,
            name: folder.name,
            parent_id: folder.parent_id,
            created_at: folder.created_at
          });
        });
        setFolders(folderList);
        
        // Fetch files
        const response = await listFiles({ 
          providerId: selectedProvider.id,
          folderId: currentFolderId || undefined,
          search: searchQuery || undefined,
          limit: 50 
        });
        const fileList = response.objects?.map(toFileMetadata) || [];
        console.log('Files loaded:', fileList);
        setFiles(fileList);
        
        // Fetch breadcrumbs if we're in a folder
        if (currentFolderId) {
          try {
            const breadcrumbList = await getFolderBreadcrumbs(currentFolderId);
            console.log('Breadcrumbs loaded:', breadcrumbList);
            setBreadcrumbs(breadcrumbList);
            
            // Update URL with current folder path if it doesn't match
            const currentPath = buildFolderPath(breadcrumbList);
            if (currentPath !== folderPath) {
              updateURL(currentFolderId, currentPath);
            }
          } catch (error) {
            console.error('Failed to fetch breadcrumbs:', error);
            setBreadcrumbs([]);
          }
        } else {
          setBreadcrumbs([]);
          // Clear folder path from URL if we're at root
          if (folderPath) {
            updateURL(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProvider, currentFolderId, searchQuery]);

  const handleCreateFolder = useCallback(async (name: string) => {
    if (!selectedProvider) return;
    
    try {
      await createFolder(selectedProvider.id, {
        name,
        parent_id: currentFolderId || undefined
      });
      
      // Refresh folder list
      const folderList = await listFolders(selectedProvider.id, currentFolderId || undefined);
      setFolders(folderList);
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }, [selectedProvider, currentFolderId]);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      
      // Refresh folder list
      if (selectedProvider) {
        const folderList = await listFolders(selectedProvider.id, currentFolderId || undefined);
        setFolders(folderList);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  }, [selectedProvider, currentFolderId]);

  const handleSetSelectedItem = useCallback((itemId: string) => {
    setSelectedItem(itemId);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedProvider) return;

    try {
      setLoading(true);
      const { uploadFile } = await import('@/services/file.service');
      
      // Upload files one by one
      for (const file of Array.from(files)) {
        console.log('Uploading file:', file.name);
        await uploadFile(file, {
          providerId: selectedProvider.id,
          folderId: currentFolderId || undefined,
          onProgress: (progress) => {
            console.log(`Upload progress for ${file.name}:`, progress);
          }
        });
      }
      
      // Refresh file list after upload
      const response = await listFiles({ 
        providerId: selectedProvider.id,
        folderId: currentFolderId || undefined,
        limit: 50 
      });
      const fileList = response.objects?.map(toFileMetadata) || [];
      setFiles(fileList);
      
      console.log('Files uploaded successfully');
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setLoading(false);
      // Reset the input
      event.target.value = '';
    }
  }, [selectedProvider, currentFolderId]);

  const handleFolderClick = useCallback((folder: FolderItem) => {
    console.log('Navigating to folder:', folder.name, folder.id);
    setCurrentFolderId(folder.id);
    
    // Build new folder path
    const newPath = folderPath ? `${folderPath}/${folder.name}` : folder.name;
    updateURL(folder.id, newPath);
  }, [folderPath, updateURL]);

  const handleBreadcrumbClick = useCallback((breadcrumb: BreadcrumbItem | null) => {
    console.log('Breadcrumb click:', breadcrumb);
    if (breadcrumb) {
      setCurrentFolderId(breadcrumb.id);
      
      // Find the path up to this breadcrumb
      const breadcrumbIndex = breadcrumbs.findIndex(b => b.id === breadcrumb.id);
      const pathSegments = breadcrumbs.slice(0, breadcrumbIndex + 1).map(b => b.name);
      const newPath = pathSegments.join('/');
      updateURL(breadcrumb.id, newPath);
    } else {
      // Root level
      setCurrentFolderId(null);
      updateURL(null);
    }
  }, [breadcrumbs, updateURL]);

  const breadcrumbItems = useMemo(() => [
    { 
      label: selectedProvider?.name || 'Files', 
      onClick: () => handleBreadcrumbClick(null) 
    },
    ...breadcrumbs.map(breadcrumb => ({
      label: breadcrumb.name,
      onClick: () => handleBreadcrumbClick(breadcrumb)
    }))
  ], [selectedProvider?.name, breadcrumbs, handleBreadcrumbClick]);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((contentType: string) => {
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('image')) return '🖼️';
    if (contentType?.includes('video')) return '🎥';
    if (contentType?.includes('audio')) return '🎵';
    if (contentType?.includes('zip') || contentType?.includes('archive')) return '📦';
    if (contentType?.includes('presentation')) return '📊';
    if (contentType?.includes('spreadsheet')) return '📈';
    if (contentType?.includes('document')) return '📝';
    return '📄';
  }, []);

  const sortedAndFilteredFolders = useMemo(() => {
    let filtered = folders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [folders, searchQuery, sortBy, sortOrder]);
  
  const sortedAndFilteredFiles = useMemo(() => {
    let filtered = files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          comparison = (a.lastModified?.getTime() || 0) - (b.lastModified?.getTime() || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [files, searchQuery, sortBy, sortOrder]);

  const allItems = useMemo(() => 
    [...sortedAndFilteredFolders.map(f => ({ ...f, type: 'folder' })), ...sortedAndFilteredFiles.map(f => ({ ...f, type: 'file' }))],
    [sortedAndFilteredFolders, sortedAndFilteredFiles]
  );

  if (loading) {
    console.log('Component is loading...');
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with breadcrumbs and actions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="*/*"
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            <Button variant="outline" onClick={() => setShowFolderModal(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800"
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="date">Sort by Date</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            <div className="flex border border-gray-200 dark:border-gray-700 rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto">
        <FileListContent
          allItems={allItems}
          viewMode={viewMode}
          handleFolderClick={handleFolderClick}
          handleDeleteFolder={handleDeleteFolder}
          setSelectedItem={handleSetSelectedItem}
          formatBytes={formatBytes}
          getFileIcon={getFileIcon}
        />
      </div>

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateFolder}
        title="Create New Folder"
      />
    </div>
  );
}