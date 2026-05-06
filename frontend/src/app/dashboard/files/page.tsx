'use client';

import React from 'react';
import { FileManager } from '@/components/file-management';
import { useDashboard } from '../layout';

export default function FilesPage() {
  const { selectedProvider, providers, searchQuery } = useDashboard();

  return (
    <FileManager
      providerId={selectedProvider || undefined}
      providers={providers}
      searchQuery={searchQuery}
      className="h-full"
    />
  );
}