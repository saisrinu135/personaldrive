'use client';

import React, { useState, createContext, useContext } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProvidersWithMetrics } from '@/hooks/useQueries';
import { Provider } from '@/types/provider.types';
import { useRouter } from 'next/navigation';

// Create a context for dashboard state
interface DashboardContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvider: string;
  setSelectedProvider: (providerId: string) => void;
  providers: Provider[];
  metrics: any;
  metricsLoading: boolean;
  refetchData: () => Promise<void>;
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
  console.log('DashboardLayout rendering with new query hooks');
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  
  // Use the combined query hook with error boundary
  let queryResult;
  try {
    queryResult = useProvidersWithMetrics();
  } catch (error) {
    console.error('Query hook error:', error);
    // Fallback to empty state
    queryResult = {
      providers: [],
      metrics: null,
      isLoading: false,
      error: error instanceof Error ? error : new Error('Failed to initialize queries'),
      refetch: async () => {},
    };
  }
  
  const { providers, metrics, isLoading, error, refetch } = queryResult;

  // Set initial selected provider
  React.useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0].id);
    }
  }, [providers, selectedProvider]);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard data</p>
          <p className="text-sm text-gray-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{
      searchQuery,
      setSearchQuery,
      selectedProvider,
      setSelectedProvider,
      providers,
      metrics,
      metricsLoading: isLoading,
      refetchData: refetch
    }}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            selectedProvider={selectedProvider}
            providers={providers}
            onProviderSelect={setSelectedProvider}
            onAddProvider={handleAddProvider}
            metrics={metrics}
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