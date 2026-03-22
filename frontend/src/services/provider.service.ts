import axiosInstance from '@/lib/axios';
import { APIResponse } from '@/types/auth.types';
import {
  Provider,
  CreateProviderRequest,
  ProviderUpdateRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  ListProvidersParams,
  ProviderUsage,
} from '@/types/provider.types';

// ─── Validation helpers ───────────────────────────────────────────────────────

export const validateEndpointUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

export const validateProviderData = (
  data: CreateProviderRequest | TestConnectionRequest
): boolean => {
  const required: (keyof CreateProviderRequest)[] = [
    'name', 'provider_type', 'endpoint_url', 'access_key', 'secret_key', 'bucket_name', 'region',
  ];
  return required.every((field) => {
    const value = data[field];
    return value !== undefined && value !== null && value !== '';
  });
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Test connection to a provider without saving.
 * Backend: POST /api/v1/providers/test-connection
 */
export const testConnection = async (
  data: TestConnectionRequest
): Promise<TestConnectionResponse> => {
  if (!validateProviderData(data)) throw new Error('All required fields must be populated');
  if (!validateEndpointUrl(data.endpoint_url))
    throw new Error('Endpoint URL must start with http:// or https://');

  // This endpoint returns its own shape (not wrapped in APIResponse)
  const response = await axiosInstance.post<TestConnectionResponse>(
    '/api/v1/providers/test-connection',
    data
  );
  return response.data;
};

/**
 * Create a new storage provider.
 * Backend: POST /api/v1/providers/
 */
export const createProvider = async (data: CreateProviderRequest): Promise<Provider> => {
  if (!validateProviderData(data)) throw new Error('All required fields must be populated');
  if (!validateEndpointUrl(data.endpoint_url))
    throw new Error('Endpoint URL must start with http:// or https://');

  const response = await axiosInstance.post<APIResponse<Provider>>('/api/v1/providers/', data);
  return response.data.data;
};

/**
 * List all providers for the current user.
 * Backend: GET /api/v1/providers/
 */
/**
 * List all providers for the current user (includes inline usage data).
 * Backend: GET /api/v1/providers/
 */
export const listProviders = async (params?: ListProvidersParams): Promise<Provider[]> => {
  const response = await axiosInstance.get<APIResponse<Provider[]>>('/api/v1/providers/', {
    params,
  });
  return response.data.data;
};

/**
 * List all providers for the current user as a lightweight dropdown (omits usage calculation).
 * Backend: GET /api/v1/providers/dropdown
 */
export const listProvidersDropdown = async (params?: ListProvidersParams): Promise<Provider[]> => {
  const response = await axiosInstance.get<APIResponse<Provider[]>>('/api/v1/providers/dropdown', {
    params,
  });
  return response.data.data;
};

/**
 * Get a single provider by ID.
 * Backend: GET /api/v1/providers/{provider_id}
 */
export const getProvider = async (providerId: string): Promise<Provider> => {
  const response = await axiosInstance.get<APIResponse<Provider>>(
    `/api/v1/providers/${providerId}`
  );
  return response.data.data;
};

/**
 * Update a provider's settings.
 * Backend: PUT /api/v1/providers/{provider_id}
 */
export const updateProvider = async (
  providerId: string,
  data: ProviderUpdateRequest
): Promise<Provider> => {
  const response = await axiosInstance.put<APIResponse<Provider>>(
    `/api/v1/providers/${providerId}`,
    data
  );
  return response.data.data;
};

/**
 * Activate a storage provider.
 * Backend: PUT /api/v1/providers/{provider_id}/activate
 */
export const activateProvider = async (providerId: string): Promise<void> => {
  await axiosInstance.put(`/api/v1/providers/${providerId}/activate`);
};

/**
 * Deactivate a storage provider.
 * Backend: PUT /api/v1/providers/{provider_id}/deactivate
 */
export const deactivateProvider = async (providerId: string): Promise<void> => {
  await axiosInstance.put(`/api/v1/providers/${providerId}/deactivate`);
};

/**
 * Delete a storage provider.
 * Backend: DELETE /api/v1/providers/{provider_id}
 */
export const deleteProvider = async (providerId: string): Promise<void> => {
  await axiosInstance.delete(`/api/v1/providers/${providerId}`);
};

/**
 * Get storage usage metrics for a provider.
 * Backend: GET /api/v1/providers/{provider_id}/usage
 */
export const getProviderUsage = async (providerId: string): Promise<ProviderUsage> => {
  const response = await axiosInstance.get<APIResponse<ProviderUsage>>(`/api/v1/providers/${providerId}/usage`);
  return response.data.data;
};