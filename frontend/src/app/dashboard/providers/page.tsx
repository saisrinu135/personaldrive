'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { listProviders } from '@/services/provider.service';
import { Provider } from '@/types/provider.types';
import { HardDrive, Plus, Loader2, Key, Database, Server } from 'lucide-react';
import { AddProviderDialog } from '@/components/providers/AddProviderDialog';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchProviders = async () => {
    try {
      const data = await listProviders();
      setProviders(data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Storage Providers</h2>
          <p className="text-muted-foreground">Manage your connection to cloud storage services.</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddOpen(true)}>
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="p-6 border-l-4 border-l-primary flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {provider.provider_type?.toLowerCase().includes('s3') ? (
                    <Database className="w-6 h-6 text-primary" />
                  ) : (
                    <Server className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{provider.provider_name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    provider.is_active 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground w-20">Type:</span>
                <span className="font-medium text-foreground">{provider.provider_type}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground w-20">Created:</span>
                <span className="text-foreground">
                  {new Date(provider.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end space-x-2">
              <Button variant="ghost" size="sm">Edit</Button>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shadow-none border-red-200 dark:border-red-900/50">
                Remove
              </Button>
            </div>
          </Card>
        ))}

        {providers.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-border rounded-xl p-12 text-center">
            <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven't connected any cloud storage yet. Add AWS S3, local storage, or other providers to start managing files.
            </p>
            <Button variant="primary" onClick={() => setIsAddOpen(true)}>Connect Provider</Button>
          </div>
        )}
      </div>

      <AddProviderDialog 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={fetchProviders} 
      />
    </div>
  );
}
