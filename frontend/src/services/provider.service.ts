import axiosInstance from '@/lib/axios';
import {
  Provider,
  CreateProviderRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  ListProvidersParams
} from '@/types/provider.types';

// Validation Functions

/**
 * Validates that a URL starts with http:// or https://
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export const validateEndpointUrl = (url: string): boolean => {
  if (!url || url.trim() === '') {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Validates that all required provider fields are populated
 * @param data - The provider data to validate
 * @returns true if all required fields are present, false otherwise
 */
export const validateProviderData = (
  data: CreateProviderRequest | TestConnectionRequest
): boolean => {
  const requiredFields: (keyof CreateProviderRequest)[] = [
    'name',
    'provider_type',
    'endpoint_url',
    'access_key',
    'secret_key',
    'bucket_name',
    'region'
  ];
  
  return requiredFields.every(field => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
};

// API Functions

/**
 * Tests connection to a storage provider without persisting it
 * @param data - Connection parameters to test
 * @returns Promise with test result
 * @throws Error if validation fails or API request fails
 */
export const testConnection = async (
  data: TestConnectionRequest
): Promise<TestConnectionResponse> => {
  // Client-side validation
  if (!validateProviderData(data)) {
    throw new Error('All required fields must be populated');
  }
  
  if (!validateEndpointUrl(data.endpoint_url)) {
    throw new Error('Endpoint URL must start with http:// or https://');
  }
  
  const response = await axiosInstance.post<TestConnectionResponse>(
    '/api/v1/providers/test-connection',
    data
  );
  
  return response.data;
};

/**
 * Creates a new storage provider
 * @param data - Provider data to create
 * @returns Promise with created provider
 * @throws Error if validation fails or API request fails
 */
export const createProvider = async (
  data: CreateProviderRequest
): Promise<Provider> => {
  // Client-side validation
  if (!validateProviderData(data)) {
    throw new Error('All required fields must be populated');
  }
  
  if (!validateEndpointUrl(data.endpoint_url)) {
    throw new Error('Endpoint URL must start with http:// or https://');
  }
  
  const response = await axiosInstance.post<Provider>(
    '/api/v1/providers/',
    data
  );
  
  return response.data;
};

/**
 * Lists all storage providers with optional filtering
 * @param params - Optional filter parameters
 * @returns Promise with array of providers
 * @throws Error if API request fails
 */
export const listProviders = async (
  params?: ListProvidersParams
): Promise<Provider[]> => {
  const response = await axiosInstance.get<Provider[]>(
    '/api/v1/providers/',
    { params }
  );
  
  return response.data;
};

/**
 * Activates a storage provider
 * @param provider_id - ID of the provider to activate
 * @returns Promise with updated provider
 * @throws Error if API request fails
 */
export const activateProvider = async (
  provider_id: string
): Promise<Provider> => {
  const response = await axiosInstance.put<Provider>(
    `/api/v1/providers/${provider_id}/activate`
  );
  
  return response.data;
};

/**
 * Deactivates a storage provider
 * @param provider_id - ID of the provider to deactivate
 * @returns Promise with updated provider
 * @throws Error if API request fails
 */
export const deactivateProvider = async (
  provider_id: string
): Promise<Provider> => {
  const response = await axiosInstance.put<Provider>(
    `/api/v1/providers/${provider_id}/deactivate`
  );
  
  return response.data;
};