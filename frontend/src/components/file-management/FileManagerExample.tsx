'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileManager } from './FileManager';
import { FolderBreadcrumb } from './FolderBreadcrumb';
import { FolderManager } from './FolderManager';
import { FileOrganizer } from './FileOrganizer';
import { FileItem, FolderItem } from '@/types/file.types';

/**
 * FileManagerExample Component
 * 
 * Demonstrates the complete folder management functionality including:
 * - Folder creation, renaming, and deletion
 * - File organization with drag-and-drop
 * - Breadcrumb navigation
 * - Integrated file and folder management
 * 
 * This example shows how all the folder management components work together
 * to provide a comprehensive file organization system.
 */
export const FileManagerExample: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<'full' | 'breadcrumb' | 'folders' | 'organize'>('full');

  // Mock data for examples
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'presentation.pptx',
      size: 2048000,
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      uploadDate: new Date('2023-12-01'),
      folderPath: '',
    },
    {
      id: '2',
      name: 'report.pdf',
      size: 1536000,
      type: 'application/pdf',
      uploadDate: new Date('2023-12-02'),
      folderPath: 'documents',
    },
    {
      id: '3',
      name: 'photo.jpg',
      size: 512000,
      type: 'image/jpeg',
      uploadDate: new Date('2023-12-03'),
      folderPath: 'images',
    },
    {
      id: '4',
      name: 'video.mp4',
      size: 10240000,
      type: 'video/mp4',
      uploadDate: new Date('2023-12-04'),
      folderPath: 'media',
    },
  ];

  const mockFolders: FolderItem[] = [
    {
      id: '1',
      name: 'Documents',
      path: 'documents',
      createdDate: new Date('2023-11-01'),
      modifiedDate: new Date('2023-12-02'),
      fileCount: 5,
      totalSize: 5120000,
    },
    {
      id: '2',
      name: 'Images',
      path: 'images',
      createdDate: new Date('2023-11-02'),
      modifiedDate: new Date('2023-12-03'),
      fileCount: 12,
      totalSize: 8192000,
    },
    {
      id: '3',
      name: 'Media',
      path: 'media',
      createdDate: new Date('2023-11-03'),
      modifiedDate: new Date('2023-12-04'),
      fileCount: 3,
      totalSize: 25600000,
    },
    {
      id: '4',
      name: 'Projects',
      path: 'projects',
      createdDate: new Date('2023-11-04'),
      modifiedDate: new Date('2023-11-05'),
      fileCount: 0,
      totalSize: 0,
    },
  ];

  const [currentPath, setCurrentPath] = useState('documents/work');

  const handleNavigation = (path: string) => {
    setCurrentPath(path);
    console.log('Navigating to:', path);
  };

  const handleFolderClick = (folderPath: string) => {
    console.log('Folder clicked:', folderPath);
  };

  const handleFileMove = async (fileId: string, newFolderPath: string) => {
    console.log('Moving file:', fileId, 'to:', newFolderPath);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleRefresh = () => {
    console.log('Refreshing folder contents');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Folder Management Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive folder management functionality with creation, organization, and navigation.
        </p>
      </div>

      {/* Example selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedExample === 'full' ? 'primary' : 'outline'}
          onClick={() => setSelectedExample('full')}
        >
          Complete File Manager
        </Button>
        <Button
          variant={selectedExample === 'breadcrumb' ? 'primary' : 'outline'}
          onClick={() => setSelectedExample('breadcrumb')}
        >
          Breadcrumb Navigation
        </Button>
        <Button
          variant={selectedExample === 'folders' ? 'primary' : 'outline'}
          onClick={() => setSelectedExample('folders')}
        >
          Folder Management
        </Button>
        <Button
          variant={selectedExample === 'organize' ? 'primary' : 'outline'}
          onClick={() => setSelectedExample('organize')}
        >
          File Organization
        </Button>
      </div>

      {/* Examples */}
      <div className="space-y-6">
        {selectedExample === 'full' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Complete File Manager
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full-featured file manager with tabs for files, folders, and organization.
                  Includes upload, search, and view mode controls.
                </p>
              </div>
              
              <FileManager
                providerId="example-provider"
                initialPath=""
              />
            </div>
          </Card>
        )}

        {selectedExample === 'breadcrumb' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Breadcrumb Navigation
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Navigate through folder hierarchy with clickable breadcrumbs.
                  Shows current path and allows navigation to parent folders.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Current Path: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{currentPath}</code>
                  </p>
                  <FolderBreadcrumb
                    currentPath={currentPath}
                    onNavigate={handleNavigation}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPath('')}
                  >
                    Root
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPath('documents')}
                  >
                    Documents
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPath('documents/work')}
                  >
                    Documents/Work
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPath('documents/work/projects')}
                  >
                    Documents/Work/Projects
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {selectedExample === 'folders' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Folder Management
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create, rename, and delete folders. Shows folder file counts and sizes.
                  Click folders to navigate, use actions to manage them.
                </p>
              </div>
              
              <FolderManager
                folders={mockFolders}
                currentPath=""
                providerId="example-provider"
                onFolderClick={handleFolderClick}
                onRefresh={handleRefresh}
              />
            </div>
          </Card>
        )}

        {selectedExample === 'organize' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  File Organization
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop files to organize them into folders. 
                  Visual feedback shows drop targets and move operations.
                </p>
              </div>
              
              <FileOrganizer
                files={mockFiles}
                folders={mockFolders}
                currentPath=""
                providerId="example-provider"
                onFileMove={handleFileMove}
                onRefresh={handleRefresh}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Feature highlights */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Folder Management Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Folder Operations
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Create new folders</li>
                <li>• Rename existing folders</li>
                <li>• Delete folders and contents</li>
                <li>• Navigate folder hierarchy</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                File Organization
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Drag and drop files</li>
                <li>• Move files between folders</li>
                <li>• Visual drop targets</li>
                <li>• Operation status feedback</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Navigation
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Breadcrumb navigation</li>
                <li>• Clickable path segments</li>
                <li>• Current location highlighting</li>
                <li>• Quick navigation controls</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FileManagerExample;