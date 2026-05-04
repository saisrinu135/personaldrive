import axiosInstance from '@/lib/axios';

export interface StorageMetrics {
  total_size_bytes: number;
  total_count: number;
  by_provider: ProviderMetrics[];
  by_type: TypeMetrics[];
}

export interface ProviderMetrics {
  provider_id: string;
  provider_name: string;
  provider_type: string;
  storage_used_bytes: number;
  file_count: number;
}

export interface TypeMetrics {
  content_type: string;
  count: number;
  size_bytes: number;
}

/**
 * Get overall storage metrics for the current user
 */
export const getStorageMetrics = async (): Promise<StorageMetrics> => {
  const response = await axiosInstance.get('/api/v1/metrics/storage');
  return response.data.data;
};

/**
 * Get metrics for a specific provider
 */
export const getProviderMetrics = async (providerId: string): Promise<ProviderMetrics> => {
  const response = await axiosInstance.get(`/api/v1/metrics/providers/${providerId}`);
  return response.data.data;
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((used / total) * 100, 100);
};