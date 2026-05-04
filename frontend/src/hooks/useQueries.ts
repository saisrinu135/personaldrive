'use client';

import { useQuery, useQueryClient } from '@/lib/query-client';
import { getStorageMetrics, StorageMetrics } from '@/services/metrics.service';
import { listProviders } from '@/services/provider.service';
import { Provider } from '@/types/provider.types';

// Query keys
export const QUERY_KEYS = {
  METRICS: ['metrics', 'storage'] as const,
  PROVIDERS: ['providers'] as const,
  PROVIDER: (id: string) => ['providers', id] as const,
} as const;

// Metrics query hook
export const useMetricsQuery = () => {
  return useQuery(
    QUERY_KEYS.METRICS,
    getStorageMetrics,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );
};

// Providers query hook
export const useProvidersQuery = () => {
  return useQuery(
    QUERY_KEYS.PROVIDERS,
    listProviders,
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  );
};

// Combined hook that merges providers with metrics
export const useProvidersWithMetrics = () => {
  const { data: providers, isLoading: providersLoading, error: providersError, refetch: refetchProviders } = useProvidersQuery();
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMetricsQuery();

  if (providersError) {
    console.error('Providers query error:', providersError instanceof Error ? providersError.message : String(providersError));
  }
  if (metricsError) {
    console.error('Metrics query error:', metricsError instanceof Error ? metricsError.message : String(metricsError));
  }

  // If providers fail to load, return empty array but still try to get metrics
  const safeProviders = providers || [];
  
  const providersWithUsage = safeProviders.map(provider => {
    const providerMetrics = metrics?.by_provider?.find(
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

  const refetch = async () => {
    await Promise.all([refetchProviders(), refetchMetrics()]);
  };

  return {
    providers: providersWithUsage,
    metrics,
    isLoading: providersLoading || metricsLoading,
    error: providersError || metricsError,
    refetch,
  };
};

// Hook for invalidating related queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidateMetrics = () => {
    queryClient.invalidateQueries(QUERY_KEYS.METRICS);
  };

  const invalidateProviders = () => {
    queryClient.invalidateQueries(QUERY_KEYS.PROVIDERS);
  };

  const invalidateProvider = (id: string) => {
    queryClient.invalidateQueries(QUERY_KEYS.PROVIDER(id));
  };

  const invalidateAll = () => {
    queryClient.invalidateQueriesMatching(() => true);
  };

  // Invalidate both providers and metrics when provider data changes
  const invalidateProviderData = () => {
    invalidateProviders();
    invalidateMetrics();
  };

  return {
    invalidateMetrics,
    invalidateProviders,
    invalidateProvider,
    invalidateProviderData,
    invalidateAll,
  };
};