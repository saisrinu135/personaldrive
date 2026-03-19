/**
 * Provider type enumeration
 */
export enum ProviderType {
  ORACLE = 'oracle',
  AWS = 'aws',
  CLOUDFLARE = 'cloudflare',
  OTHERS = 'others'
}

/**
 * Main Provider interface
 */
export interface Provider {
  id: string;
  name: string;
  provider_type: ProviderType;
  endpoint_url: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
  region: string;
  is_active: boolean;
  created_at: string;
  
  // Optional fields
  provider_name?: string;
  is_default?: boolean;
  storage_limit_gb?: number;
  notes?: string;
  updated_at?: string;
}

/**
 * Request to create a new provider
 */
export interface CreateProviderRequest {
  name: string;
  provider_type: ProviderType;
  endpoint_url: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
  region: string;
  
  // Optional fields
  provider_name?: string;
  is_default?: boolean;
  storage_limit_gb?: number;
  notes?: string;
}

/**
 * Request to update an existing provider (all fields optional)
 */
export interface ProviderUpdateRequest {
  name?: string;
  provider_type?: ProviderType;
  endpoint_url?: string;
  access_key?: string;
  secret_key?: string;
  bucket_name?: string;
  region?: string;
  provider_name?: string;
  is_default?: boolean;
  storage_limit_gb?: number;
  notes?: string;
}

/**
 * Request to test provider connection
 */
export interface TestConnectionRequest {
  name: string;
  provider_type: ProviderType;
  endpoint_url: string;
  access_key: string;
  secret_key: string;
  bucket_name: string;
  region: string;
  
  // Optional fields
  provider_name?: string;
  is_default?: boolean;
  storage_limit_gb?: number;
  notes?: string;
}

/**
 * Response from connection test
 */
export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

/**
 * Parameters for listing providers
 */
export interface ListProvidersParams {
  is_active?: boolean;
}
