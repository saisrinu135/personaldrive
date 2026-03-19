'use client';

import React from 'react';
import {
  StorageUsageCard,
  FileCountCard,
  RecentFilesCard,
  StorageDistributionChart,
  QuickActionsCard,
  type StorageDistribution,
} from './index';
import { FileMetadata } from '@/types/file.types';

/**
 * Example component demonstrating how to use all dashboard statistics components
 * This shows the complete dashboard layout with sample data
 */
export const DashboardExample: React.FC = () => {
  // Sample data for demonstration
  const sampleRecentFiles: FileMetadata[] = [
    {
      id: '1',
      name: 'Project_Proposal.pdf',
      size: 2048576, // 2 MB
      type: 'application/pdf',
      path: '/documents/Project_Proposal.pdf',
      uploadDate: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      lastModified: new Date(Date.now() - 1000 * 60 * 30),
      checksum: 'abc123',
    },
    {
      id: '2',
      name: 'vacation_photo.jpg',
      size: 5242880, // 5 MB
      type: 'image/jpeg',
      path: '/images/vacation_photo.jpg',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
      checksum: 'def456',
      thumbnail: 'https://via.placeholder.com/150x150/4f46e5/ffffff?text=IMG',
    },
    {
      id: '3',
      name: 'presentation.pptx',
      size: 15728640, // 15 MB
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      path: '/documents/presentation.pptx',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
      checksum: 'ghi789',
    },
    {
      id: '4',
      name: 'demo_video.mp4',
      size: 104857600, // 100 MB
      type: 'video/mp4',
      path: '/videos/demo_video.mp4',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      checksum: 'jkl012',
    },
    {
      id: '5',
      name: 'music_track.mp3',
      size: 8388608, // 8 MB
      type: 'audio/mpeg',
      path: '/audio/music_track.mp3',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      checksum: 'mno345',
    },
  ];

  const storageDistribution: StorageDistribution = {
    documents: { size: 52428800, count: 25, color: '#3b82f6' }, // 50 MB, blue
    images: { size: 157286400, count: 45, color: '#10b981' }, // 150 MB, green
    videos: { size: 524288000, count: 8, color: '#f59e0b' }, // 500 MB, amber
    audio: { size: 83886080, count: 15, color: '#8b5cf6' }, // 80 MB, violet
    archives: { size: 20971520, count: 5, color: '#ef4444' }, // 20 MB, red
    others: { size: 10485760, count: 12, color: '#6b7280' }, // 10 MB, gray
  };

  const totalStorageUsed = Object.values(storageDistribution).reduce(
    (total, category) => total + category.size,
    0
  );

  const totalFiles = Object.values(storageDistribution).reduce(
    (total, category) => total + category.count,
    0
  );

  const fileTypeBreakdown = {
    documents: storageDistribution.documents.count,
    images: storageDistribution.images.count,
    videos: storageDistribution.videos.count,
    audio: storageDistribution.audio.count,
    others: storageDistribution.others.count + storageDistribution.archives.count,
  };

  // Event handlers
  const handleDownloadFile = (file: FileMetadata) => {
    console.log('Downloading file:', file.name);
    // Implement download logic here
  };

  const handleViewAllFiles = () => {
    console.log('Navigating to files page');
    // Implement navigation to files page
  };

  const handleUploadFiles = () => {
    console.log('Opening file upload dialog');
    // Implement file upload logic
  };

  const handleCreateFolder = () => {
    console.log('Creating new folder');
    // Implement folder creation logic
  };

  const handleManageProviders = () => {
    console.log('Navigating to providers page');
    // Implement navigation to providers page
  };

  const handleSearchFiles = () => {
    console.log('Opening file search');
    // Implement file search logic
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your cloud storage account
        </p>
      </div>

      {/* Top row - Storage overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StorageUsageCard
          storageUsed={totalStorageUsed}
          storageLimit={1073741824000} // 1 TB
          className="lg:col-span-1"
        />
        
        <FileCountCard
          totalFiles={totalFiles}
          fileTypeBreakdown={fileTypeBreakdown}
          className="lg:col-span-1"
        />

        <QuickActionsCard
          onUploadFiles={handleUploadFiles}
          onCreateFolder={handleCreateFolder}
          onManageProviders={handleManageProviders}
          onSearchFiles={handleSearchFiles}
          className="lg:col-span-1"
        />
      </div>

      {/* Bottom row - Recent files and distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentFilesCard
          recentFiles={sampleRecentFiles}
          onDownload={handleDownloadFile}
          onViewAll={handleViewAllFiles}
          maxFiles={5}
          className="lg:col-span-1"
        />

        <StorageDistributionChart
          distribution={storageDistribution}
          totalSize={totalStorageUsed}
          className="lg:col-span-1"
        />
      </div>

      {/* Additional information */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Dashboard Components</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This example demonstrates all the dashboard statistics components working together:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>StorageUsageCard</strong>: Shows storage usage with progress bar and warnings</li>
          <li>• <strong>FileCountCard</strong>: Displays total files and breakdown by type</li>
          <li>• <strong>RecentFilesCard</strong>: Lists recently uploaded files with actions</li>
          <li>• <strong>StorageDistributionChart</strong>: Visual pie chart of storage by file type</li>
          <li>• <strong>QuickActionsCard</strong>: Provides quick access to common operations</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardExample;