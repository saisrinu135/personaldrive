'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { listProviders } from '@/services/provider.service';
import { getStorageMetrics } from '@/services/metrics.service';
import { Provider } from '@/types/provider.types';
import { useRouter } from 'next/navigation';

// Create a context for dashboard state
interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvider: string;
  setSelectedProvider: (providerId: string) => void;
  providers: Provider[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('Fetching providers and metrics...');
        const providersResponse = await listProviders();
        console.log('Providers response:', providersResponse);
        
        // Try to get metrics, but don't fail if it doesn't work
        let metricsResponse = null;
        try {
          metricsResponse = await getStorageMetrics();
          console.log('Metrics response:', metricsResponse);
        } catch (metricsError) {
          console.warn('Failed to fetch metrics, continuing without them:', metricsError);
        }
        
        // Merge providers with their usage metrics if available
        const providersWithUsage = providersResponse.map(provider => {
          const providerMetrics = metricsResponse?.by_provider?.find(
            metric => metric.provider_id === provider.id
          );
          
          return {
            ...provider,
            usage: providerMetrics ? {
              provider_id: providerMetrics.provider_id,
              provider_name: providerMetrics.provider_name,
              total_size_bytes: providerMetrics.storage_used_bytes,
              total_objects: providerMetrics.file_count,
              total_size_mb: providerMetrics.storage_used_bytes / (1024 * 1024),
              total_size_gb: providerMetrics.storage_used_bytes / (1024 * 1024 * 1024)
            } : {
              provider_id: provider.id,
              provider_name: provider.name,
              total_size_bytes: 0,
              total_objects: 0,
              total_size_mb: 0,
              total_size_gb: 0
            }
          };
        });
        
        console.log('Final providers with usage:', providersWithUsage);
        setProviders(providersWithUsage || []);
        if (providersWithUsage?.length > 0) {
          setSelectedProvider(providersWithUsage[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleAddProvider = () => {
    router.push('/dashboard/providers?add=true');
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const selectedProviderData = providers.find((p) => p.id === selectedProvider);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{
      searchQuery,
      setSearchQuery,
      selectedProvider,
      setSelectedProvider,
      providers
    }}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            selectedProvider={selectedProvider}
            providers={providers}
            onProviderSelect={setSelectedProvider}
            onAddProvider={handleAddProvider}
          />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            onSearch={handleSearch}
            onAddProvider={handleAddProvider}
            onProviderSelect={setSelectedProvider}
            currentUser={user || undefined}
            selectedProvider={selectedProviderData}
            providers={providers}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
          
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation />
      </div>
    </DashboardContext.Provider>
  );
}