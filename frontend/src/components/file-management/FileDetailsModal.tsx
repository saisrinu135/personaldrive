'use client';

import React, { useState } from 'react';
import { X, Download, Share2, Copy, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface FileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    size_bytes: number;
    content_type: string;
    last_modified: string;
    provider_name: string;
    path?: string;
    etag?: string;
    storage_class?: string;
    url?: string;
  } | null;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  isOpen,
  onClose,
  file
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'activity'>('details');

  if (!isOpen || !file) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('image')) return '🖼️';
    if (contentType?.includes('video')) return '🎥';
    if (contentType?.includes('audio')) return '🎵';
    if (contentType?.includes('zip') || contentType?.includes('archive')) return '📦';
    if (contentType?.includes('presentation')) return '📊';
    if (contentType?.includes('spreadsheet')) return '📈';
    if (contentType?.includes('document')) return '📝';
    return '📄';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="md:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-3xl">{getFileIcon(file.content_type)}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {file.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file.provider_name} • {file.path || 'my-bucket/Reports/Q2/'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Move
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="hidden md:block">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details' },
              { id: 'versions', label: 'Versions' },
              { id: 'activity', label: 'Activity' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Type
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {file.content_type || 'PDF Document'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Size
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatBytes(file.size_bytes)} ({file.size_bytes.toLocaleString()} bytes)
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Last Modified
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {file.last_modified}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    ETag
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {file.etag || 'a3f5c2e1d9b4c6f8e...'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Storage Class
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {file.storage_class || 'STANDARD'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Server Side Encryption
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    AES-256 (SSE-S3)
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  URL
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-mono flex-1 truncate">
                    {file.url || `https://my-bucket.s3.amazonaws.com/Reports/Q2/${file.name}`}
                  </p>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No versions available for this file.
              </p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    File uploaded
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.last_modified} • 2:30 PM
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetailsModal;