'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { listProviders } from '@/services/provider.service';
import { Provider } from '@/types/provider.types';
import { HardDrive, Plus, Loader2 } from 'lucide-react';
import { AddProviderDialog } from '@/components/providers/AddProviderDialog';
import { ProviderCard } from '@/components/providers/ProviderCard';

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
        <Button variant="default" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddOpen(true)}>
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onRefresh={fetchProviders} />
        ))}

        {providers.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-border rounded-xl p-12 text-center">
            <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              You haven't connected any cloud storage yet. Add AWS S3, local storage, or other providers to start managing files.
            </p>
            <Button variant="default" onClick={() => setIsAddOpen(true)}>Connect Provider</Button>
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
