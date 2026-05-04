'use client';

import React, { useEffect, useState } from 'react';
import { Upload, FolderPlus, Trash2, Link } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Provider } from '@/types/provider.types';
import { useRouter } from 'next/navigation';
import { useDashboard } from './layout';

export default function DashboardPage() {
  const router = useRouter();
  const { providers } = useDashboard();
  const [loading, setLoading] = useState(true);

  // Set loading to false once we have the providers from context
  useEffect(() => {
    setLoading(false);
  }, [providers]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProviderIcon = (type: string) => {
    const icons = {
      aws: '🟠',
      cloudflare: '🟠',
      oracle: '🔴', 
      minio: '🟣',
      backblaze: '🔴',
      digitalocean: '🔵'
    };
    return icons[type as keyof typeof icons] || '☁️';
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('image')) return '🖼️';
    if (contentType.includes('video')) return '🎥';
    if (contentType.includes('audio')) return '🎵';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    if (contentType.includes('presentation')) return '📊';
    if (contentType.includes('spreadsheet')) return '📈';
    if (contentType.includes('document')) return '📝';
    return '📄';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your cloud storage.
        </p>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <p>Loading: {loading.toString()}</p>
            <p>Storage Accounts Count: {storageAccounts.length}</p>
            <p>Will show empty state: {(storageAccounts.length === 0).toString()}</p>
            <p>Will show accounts: {(storageAccounts.length > 0).toString()}</p>
            <p>Storage Accounts: {JSON.stringify(storageAccounts.map(a => ({ id: a.id, name: a.name, type: a.provider_type })), null, 2)}</p>
          </div>
        </Card>
      )}

      {/* Storage Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Accounts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/providers?add=true')}
          >
            + Add Account
          </Button>
        </div>
        
        {/* Conditional rendering with explicit check */}
        {(() => {
          console.log('Rendering condition check:', { 
            length: storageAccounts.length, 
            isEmpty: storageAccounts.length === 0,
            accounts: storageAccounts 
          });
          
          if (storageAccounts.length === 0) {
            return (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">☁️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No storage accounts connected
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect your first S3-compatible storage account to get started.
                </p>
                <Button 
                  onClick={() => router.push('/dashboard/providers?add=true')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Storage Account
                </Button>
              </Card>
            );
          }
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageAccounts.map((account) => (
                <Card key={account.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push('/dashboard/files?provider=' + account.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getProviderIcon(account.provider_type)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{account.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {account.provider_type}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Add account menu
                    }}>⋯</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatBytes(account.usage?.total_size_bytes || 0)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {account.usage?.total_objects || 0} files
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/files?upload=true')}
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">Upload</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/files?newfolder=true')}
          >
            <FolderPlus className="w-6 h-6" />
            <span className="text-sm">New Folder</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2 opacity-50 cursor-not-allowed"
            disabled
          >
            <Trash2 className="w-6 h-6" />
            <span className="text-sm">Create Bucket</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/providers')}
          >
            <Link className="w-6 h-6" />
            <span className="text-sm">Manage Keys</span>
          </Button>
        </div>
      </div>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Files</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/files')}>
              View all
            </Button>
          </div>
          
          <Card className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentFiles.map((file) => (
                <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.content_type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatBytes(file.size_bytes)} • {file.last_modified}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">⋯</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}