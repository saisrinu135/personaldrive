'use client';

import React, { useEffect, useState } from 'react';
import { FileManager } from '@/components/file-management/FileManager';
import { listProvidersDropdown } from '@/services/provider.service';
import { Provider } from '@/types/provider.types';
import { Loader2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function FilesPage() {
  const [providerId, setProviderId] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await listProvidersDropdown();
        setProviders(data);
        if (data.length > 0) {
          // Default to first available active provider
          const activeProvider = data.find(p => p.is_active) || data[0];
          setProviderId(activeProvider.id);
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-primary font-medium">Loading File System...</span>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-6">
        <Card className="text-center py-16 px-4">
          <HardDrive className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-foreground mb-2">No Storage Providers</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You need to configure a storage provider (like AWS S3) before you can manage files.
          </p>
          <Link href="/dashboard/providers">
            <Button size="lg" variant="primary">
              Configure Storage Provider
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Provider Selector (Always show) */}
      <div className="flex items-center space-x-2 bg-card p-3 rounded-lg border border-border shadow-sm">
        <span className="text-sm font-medium text-muted-foreground">Active Storage:</span>
        <select 
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Storage Providers</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>
              {p.provider_name} {p.is_active ? '' : '(Inactive)'}
            </option>
          ))}
        </select>
      </div>

      {/* Main File Manager */}
      <FileManager providerId={providerId} providers={providers} />
    </div>
  );
}
