'use client';

import React, { useState, useEffect } from 'react';
import { FileList } from './FileList';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FileItem } from '@/types/file.types';
import { listFiles, toFileMetadata } from '@/services/file.service';
import { Grid, List, RefreshCw } from 'lucide-react';

/**
 * FileListExample Component
 * 
 * Demonstrates the FileList component with real data from the file service.
 * Shows both grid and list view modes with refresh functionality.
 */
export const FileListExample: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [error, setError] = useState<string | null>(null);

  // Mock provider ID - in real usage this would come from props or context
  const providerId = 'example-provider-id';

  // Load files
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would get the provider ID from context or props
      const response = await listFiles({
        providerId,
        page: 1,
        limit: 50,
      });

      // Convert API response to FileItem format
      const fileItems: FileItem[] = response.objects.map(obj => {
        const metadata = toFileMetadata(obj);
        return {
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          type: metadata.type,
          uploadDate: metadata.uploadDate,
          // In a real app, you would generate these URLs from the backend
          downloadUrl: undefined, // Will be generated on demand
          thumbnail: metadata.type.startsWith('image/') ? undefined : undefined, // Will be generated on demand
        };
      });

      setFiles(fileItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      // For demo purposes, use mock data if API fails
      setFiles(generateMockFiles());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock files for demonstration
  const generateMockFiles = (): FileItem[] => {
    return [
      {
        id: '1',
        name: 'vacation-photo.jpg',
        size: 2048576, // 2MB
        type: 'image/jpeg',
        uploadDate: new Date('2024-01-15T10:30:00Z'),
        thumbnail: 'https://picsum.photos/200/200?random=1',
      },
      {
        id: '2',
        name: 'presentation.pdf',
        size: 5242880, // 5MB
        type: 'application/pdf',
        uploadDate: new Date('2024-01-14T14:20:00Z'),
      },
      {
        id: '3',
        name: 'music-track.mp3',
        size: 8388608, // 8MB
        type: 'audio/mpeg',
        uploadDate: new Date('2024-01-13T09:15:00Z'),
      },
      {
        id: '4',
        name: 'document.docx',
        size: 1048576, // 1MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadDate: new Date('2024-01-12T16:45:00Z'),
      },
      {
        id: '5',
        name: 'screenshot.png',
        size: 3145728, // 3MB
        type: 'image/png',
        uploadDate: new Date('2024-01-11T11:30:00Z'),
        thumbnail: 'https://picsum.photos/200/200?random=2',
      },
      {
        id: '6',
        name: 'video-clip.mp4',
        size: 52428800, // 50MB
        type: 'video/mp4',
        uploadDate: new Date('2024-01-10T13:20:00Z'),
      },
    ];
  };

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Handle file download
  const handleDownload = async (file: FileItem) => {
    console.log('Downloading file:', file.name);
    // In a real app, this would trigger the actual download
    // The FileList component handles the default download behavior
  };

  // Handle file deletion
  const handleDelete = async (file: FileItem) => {
    console.log('Deleting file:', file.name);
    // Remove file from local state for demo
    setFiles(prev => prev.filter(f => f.id !== file.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>File List Example</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFiles}
                disabled={loading}
                loading={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                Showing mock data for demonstration
              </p>
            </div>
          )}
          
          <FileList
            files={files}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onRefresh={loadFiles}
            loading={loading}
            providerId={providerId}
            viewMode={viewMode}
            emptyMessage="No files uploaded yet"
          />
        </CardContent>
      </Card>

      {/* Usage information */}
      <Card>
        <CardHeader>
          <CardTitle>FileList Component Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Grid and list view modes</li>
                <li>Thumbnail generation for supported image formats</li>
                <li>Download and delete functionality with loading states</li>
                <li>File metadata display (name, size, upload date)</li>
                <li>Responsive design for mobile and desktop</li>
                <li>Loading states and empty state handling</li>
                <li>Error handling with user-friendly messages</li>
                <li>Smooth animations with framer-motion</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Supported File Types:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Images: JPEG, PNG, GIF, WebP (with thumbnails)</li>
                <li>Documents: PDF, Word, Excel, PowerPoint</li>
                <li>Media: Video and audio files</li>
                <li>Archives: ZIP, RAR, and other compressed formats</li>
                <li>Text files and other document types</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileListExample;