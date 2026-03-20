'use client';

import React, { useEffect, useState } from 'react';
import {
  StorageUsageCard,
  FileCountCard,
  RecentFilesCard,
  StorageDistributionChart,
  QuickActionsCard,
  type StorageDistribution,
} from '@/components/dashboard';
import { FileMetadata } from '@/types/file.types';
import { listFiles, toFileMetadata, getUserStats } from '@/services/file.service';
import { listProviders } from '@/services/provider.service';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardOverviewPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data state
  const [recentFiles, setRecentFiles] = useState<FileMetadata[]>([]);
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [fileTypeBreakdown, setFileTypeBreakdown] = useState({
    documents: 0,
    images: 0,
    videos: 0,
    audio: 0,
    others: 0,
  });
  const [storageDistribution, setStorageDistribution] = useState<StorageDistribution>({
    documents: { size: 0, count: 0, color: '#3b82f6' },
    images: { size: 0, count: 0, color: '#10b981' },
    videos: { size: 0, count: 0, color: '#f59e0b' },
    audio: { size: 0, count: 0, color: '#8b5cf6' },
    archives: { size: 0, count: 0, color: '#ef4444' },
    others: { size: 0, count: 0, color: '#6b7280' },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch exactly 5 recent files for the list explicitly
        const fileListResponse = await listFiles({ limit: 5 }); 
        const apiFiles = fileListResponse.objects || [];
        const files = apiFiles.map(toFileMetadata);
        setRecentFiles(files);
        
        // 2. Fetch global storage statistics computed natively by PostgreSQL
        const stats = await getUserStats();
        
        setTotalFiles(stats.total_count);
        setTotalStorageUsed(stats.total_size_bytes);
        
        const distribution: StorageDistribution = {
          documents: { size: 0, count: 0, color: '#3b82f6' },
          images: { size: 0, count: 0, color: '#10b981' },
          videos: { size: 0, count: 0, color: '#f59e0b' },
          audio: { size: 0, count: 0, color: '#8b5cf6' },
          archives: { size: 0, count: 0, color: '#ef4444' },
          others: { size: 0, count: 0, color: '#6b7280' },
        };
        
        const breakdown = { documents: 0, images: 0, videos: 0, audio: 0, others: 0 };

        for (const stat of stats.by_type) {
          const type = stat.content_type?.toLowerCase() || '';
          
          if (type.startsWith('image/')) {
            distribution.images.size += stat.size_bytes;
            distribution.images.count += stat.count;
            breakdown.images += stat.count;
          } else if (type.startsWith('video/')) {
            distribution.videos.size += stat.size_bytes;
            distribution.videos.count += stat.count;
            breakdown.videos += stat.count;
          } else if (type.startsWith('audio/')) {
            distribution.audio.size += stat.size_bytes;
            distribution.audio.count += stat.count;
            breakdown.audio += stat.count;
          } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
            distribution.documents.size += stat.size_bytes;
            distribution.documents.count += stat.count;
            breakdown.documents += stat.count;
          } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
            distribution.archives.size += stat.size_bytes;
            distribution.archives.count += stat.count;
            breakdown.others += stat.count;
          } else {
            distribution.others.size += stat.size_bytes;
            distribution.others.count += stat.count;
            breakdown.others += stat.count;
          }
        }
        
        setStorageDistribution(distribution);
        setFileTypeBreakdown(breakdown);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Quick Action Handlers
  const handleUploadFiles = () => router.push('/dashboard/files?upload=true');
  const handleViewAllFiles = () => router.push('/dashboard/files');
  const handleManageProviders = () => router.push('/dashboard/providers');
  const handleSearchFiles = () => router.push('/dashboard/files?search=true');
  
  // Download File Handler
  const handleDownloadFile = async (file: FileMetadata) => {
    try {
      // Re-use download service function
      const { downloadFile } = await import('@/services/file.service');
      await downloadFile(file.id, file.name);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-primary font-medium">Loading Dashboard Data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top row - Storage overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StorageUsageCard
          storageUsed={totalStorageUsed}
          storageLimit={1073741824000} // Example 1 TB limit
          className="lg:col-span-1"
        />
        
        <FileCountCard
          totalFiles={totalFiles}
          fileTypeBreakdown={fileTypeBreakdown}
          className="lg:col-span-1"
        />

        <QuickActionsCard
          onUploadFiles={handleUploadFiles}
          onCreateFolder={() => {}} // Disabled as folder backend is unready
          onManageProviders={handleManageProviders}
          onSearchFiles={handleSearchFiles}
          className="lg:col-span-1"
        />
      </div>

      {/* Bottom row - Recent files and distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentFilesCard
          recentFiles={recentFiles}
          onDownload={handleDownloadFile}
          onViewAll={handleViewAllFiles}
          maxFiles={5}
          className="lg:col-span-1"
        />

        {totalFiles > 0 ? (
          <StorageDistributionChart
            distribution={storageDistribution}
            totalSize={totalStorageUsed}
            className="lg:col-span-1"
          />
        ) : (
          <div className="flex items-center justify-center p-8 bg-card rounded-xl border border-border text-muted-foreground lg:col-span-1">
            Upload files to see your storage distribution.
          </div>
        )}
      </div>
    </div>
  );
}
