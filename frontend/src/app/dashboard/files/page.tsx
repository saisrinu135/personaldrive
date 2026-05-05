'use client';

import React from 'react';
import { FileManager } from '@/components/file-management';
import { useDashboard } from '../layout';

export default function FilesPage() {
  const { selectedProvider, providers, searchQuery } = useDashboard();

  if (!selectedProvider) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <FileManager
      providerId={selectedProvider}
      providers={providers}
      searchQuery={searchQuery}
      className="h-full"
    />
  );
}