'use client';

import * as providerService from '@/services/provider.service';
import { useInvalidateQueries } from '@/hooks/useQueries';
import { 
  Provider, 
  CreateProviderRequest, 
  ProviderUpdateRequest, 
  TestConnectionRequest 
} from '@/types/provider.types';

// Enhanced provider service with cache invalidation
export const useProviderMutations = () => {
  const { invalidateProviderData } = useInvalidateQueries();

  const createProvider = async (data: CreateProviderRequest): Promise<Provider> => {
    const result = await providerService.createProvider(data);
    // Invalidate both providers and metrics cache
    invalidateProviderData();
    return result;
  };

  const updateProvider = async (
    providerId: string, 
    data: ProviderUpdateRequest
  ): Promise<Provider> => {
    const result = await providerService.updateProvider(providerId, data);
    // Invalidate both providers and metrics cache
    invalidateProviderData();
    return result;
  };

  const deleteProvider = async (providerId: string): Promise<void> => {
    await providerService.deleteProvider(providerId);
    // Invalidate both providers and metrics cache
    invalidateProviderData();
  };

  const activateProvider = async (providerId: string): Promise<void> => {
    await providerService.activateProvider(providerId);
    // Invalidate both providers and metrics cache
    invalidateProviderData();
  };

  const deactivateProvider = async (providerId: string): Promise<void> => {
    await providerService.deactivateProvider(providerId);
    // Invalidate both providers and metrics cache
    invalidateProviderData();
  };

  // Test connection doesn't need cache invalidation
  const testConnection = providerService.testConnection;

  return {
    createProvider,
    updateProvider,
    deleteProvider,
    activateProvider,
    deactivateProvider,
    testConnection,
  };
};