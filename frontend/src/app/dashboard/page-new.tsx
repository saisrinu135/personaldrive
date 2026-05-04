'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { useDashboard } from './layout';

export default function DashboardPage() {
  const router = useRouter();
  const { providers } = useDashboard();

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

        {providers.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((account) => (
              <Card
                key={account.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    ⋯
                  </Button>
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
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/files')}
          >
            <span className="text-2xl">📁</span>
            <span className="text-sm">Browse Files</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/providers?add=true')}
          >
            <span className="text-2xl">➕</span>
            <span className="text-sm">Add Account</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            onClick={() => router.push('/dashboard/providers')}
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-sm">Manage Keys</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
            disabled
          >
            <span className="text-2xl">🗑️</span>
            <span className="text-sm">Recycle Bin</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
