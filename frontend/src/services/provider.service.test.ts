import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  listProviders,
  activateProvider,
  deactivateProvider,
  validateEndpointUrl,
  validateProviderData,
  createProvider,
  testConnection
} from './provider.service';
import {
  Provider,
  ProviderType,
  CreateProviderRequest,
  TestConnectionRequest,
  ListProvidersParams
} from '@/types/provider.types';
import axiosInstance from '@/lib/axios';

// Mock the axios instance
vi.mock('@/lib/axios');

describe('Provider Service - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Valid URL Validation
   * **Validates: Requirements 3.2, 3.3**
   * 
   * For any string that starts with "http://" or "https://",
   * the validateEndpointUrl function should return true.
   */
  describe('Property 1: Valid URL Validation', () => {
    it('should return true for all URLs starting with http:// or https://', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('http://'),
            fc.constant('https://')
          ),
          fc.string({ minLength: 1 }),
          (protocol, path) => {
            const url = protocol + path;
            expect(validateEndpointUrl(url)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Invalid URL Validation
   * **Validates: Requirements 3.4, 3.5**
   * 
   * For any string that does not start with "http://" or "https://",
   * the validateEndpointUrl function should return false.
   */
  describe('Property 2: Invalid URL Validation', () => {
    it('should return false for URLs not starting with http:// or https://', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://')),
          (url) => {
            expect(validateEndpointUrl(url)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should return false for empty strings', () => {
      expect(validateEndpointUrl('')).toBe(false);
      expect(validateEndpointUrl('   ')).toBe(false);
    });
  });

  /**
   * Property 3: Complete Provider Data Validation
   * **Validates: Requirements 4.2**
   * 
   * For any CreateProviderRequest object where all required fields are populated
   * with non-empty values, the validateProviderData function should return true.
   */
  describe('Property 3: Complete Provider Data Validation', () => {
    it('should return true for complete provider data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.string({ minLength: 1 }),
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
            // Optional fields can be present or undefined
            provider_name: fc.option(fc.string({ minLength: 1 })),
            is_default: fc.option(fc.boolean()),
            storage_limit_gb: fc.option(fc.integer({ min: 1, max: 10000 })),
            notes: fc.option(fc.string()),
          }),
          (data) => {
            expect(validateProviderData(data as CreateProviderRequest)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Incomplete Provider Data Validation
   * **Validates: Requirements 4.3**
   * 
   * For any CreateProviderRequest object where at least one required field is
   * empty, undefined, or null, the validateProviderData function should return false.
   */
  describe('Property 4: Incomplete Provider Data Validation', () => {
    it('should return false when any required field is missing', () => {
      const requiredFields = ['name', 'provider_type', 'endpoint_url', 'access_key', 'secret_key', 'bucket_name', 'region'];
      
      // Test each required field being missing one at a time
      requiredFields.forEach(fieldToOmit => {
        fc.assert(
          fc.property(
            fc.record({
              name: fieldToOmit === 'name' ? fc.constant('') : fc.string({ minLength: 1 }),
              provider_type: fieldToOmit === 'provider_type' ? fc.constant('') : fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
              endpoint_url: fieldToOmit === 'endpoint_url' ? fc.constant('') : fc.string({ minLength: 1 }),
              access_key: fieldToOmit === 'access_key' ? fc.constant('') : fc.string({ minLength: 1 }),
              secret_key: fieldToOmit === 'secret_key' ? fc.constant('') : fc.string({ minLength: 1 }),
              bucket_name: fieldToOmit === 'bucket_name' ? fc.constant('') : fc.string({ minLength: 1 }),
              region: fieldToOmit === 'region' ? fc.constant('') : fc.string({ minLength: 1 }),
            }),
            (data) => {
              expect(validateProviderData(data as CreateProviderRequest)).toBe(false);
            }
          ),
          { numRuns: 20 } // Fewer runs since we're testing each field
        );
      });
    });

    it('should return false when fields are undefined or null', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            provider_type: fc.option(fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'), { nil: undefined }),
            endpoint_url: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            access_key: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            secret_key: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            bucket_name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            region: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          }).filter(data => {
            // Ensure at least one required field is undefined
            const requiredFields = ['name', 'provider_type', 'endpoint_url', 'access_key', 'secret_key', 'bucket_name', 'region'];
            return requiredFields.some(field => data[field as keyof typeof data] === undefined);
          }),
          (data) => {
            expect(validateProviderData(data as any)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Pre-Request Validation
   * **Validates: Requirements 4.5, 4.6**
   * 
   * For any invalid CreateProviderRequest or TestConnectionRequest data,
   * calling createProvider or testConnection should throw an error before making the API request.
   */
  describe('Property 5: Pre-Request Validation', () => {
    it('should throw error for invalid data in createProvider without making API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.constant(''), // Invalid: empty name
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.webUrl(), // Valid URL to isolate the validation error
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
          }),
          async (invalidData) => {
            vi.clearAllMocks();
            
            // Should throw error before making API call
            await expect(createProvider(invalidData as CreateProviderRequest))
              .rejects.toThrow('All required fields must be populated');
            
            // Verify no API call was made
            expect(axiosInstance.post).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error for invalid URL in createProvider without making API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1 }),
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://') && s.length > 0), // Invalid URL but not empty
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
          }),
          async (invalidData) => {
            vi.clearAllMocks();
            
            // Should throw error before making API call
            await expect(createProvider(invalidData as CreateProviderRequest))
              .rejects.toThrow('Endpoint URL must start with http:// or https://');
            
            // Verify no API call was made
            expect(axiosInstance.post).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error for invalid data in testConnection without making API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1 }),
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.webUrl(), // Valid URL to isolate the validation error
            access_key: fc.constant(''), // Invalid: empty access_key
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
          }),
          async (invalidData) => {
            vi.clearAllMocks();
            
            // Should throw error before making API call
            await expect(testConnection(invalidData as TestConnectionRequest))
              .rejects.toThrow('All required fields must be populated');
            
            // Verify no API call was made
            expect(axiosInstance.post).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 6: Error Propagation
   * **Validates: Requirements 2.12, 6.7**
   * 
   * For any API request that fails, the service function should propagate
   * the formatted error from the HTTP client without additional wrapping.
   */
  describe('Property 6: Error Propagation', () => {
    it('should propagate axios errors without additional wrapping in createProvider', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1 }),
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.webUrl(),
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
          }),
          fc.string({ minLength: 1 }), // Error message
          fc.integer({ min: 400, max: 599 }), // HTTP status code
          async (validData, errorMessage, statusCode) => {
            vi.clearAllMocks();
            
            // Mock axios to throw a formatted error
            const mockError = new Error(errorMessage);
            (mockError as any).status = statusCode;
            vi.mocked(axiosInstance.post).mockRejectedValueOnce(mockError);
            
            // Should propagate the exact error
            try {
              await createProvider(validData as CreateProviderRequest);
              // If we reach here, the test should fail
              expect.fail('Expected createProvider to throw an error');
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toBe(errorMessage);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should propagate axios errors without additional wrapping in testConnection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1 }),
            provider_type: fc.constantFrom('oracle', 'aws', 'cloudflare', 'others'),
            endpoint_url: fc.webUrl(),
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
          }),
          fc.string({ minLength: 1 }), // Error message
          async (validData, errorMessage) => {
            vi.clearAllMocks();
            
            // Mock axios to throw a formatted error
            const mockError = new Error(errorMessage);
            vi.mocked(axiosInstance.post).mockRejectedValueOnce(mockError);
            
            // Should propagate the exact error
            try {
              await testConnection(validData as TestConnectionRequest);
              // If we reach here, the test should fail
              expect.fail('Expected testConnection to throw an error');
            } catch (error) {
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toBe(errorMessage);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Helper generators for fast-check
  const providerTypeArb = fc.constantFrom(
    ProviderType.ORACLE,
    ProviderType.AWS,
    ProviderType.CLOUDFLARE,
    ProviderType.OTHERS
  );

  const providerArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1 }),
    provider_type: providerTypeArb,
    endpoint_url: fc.webUrl(),
    access_key: fc.string({ minLength: 1 }),
    secret_key: fc.string({ minLength: 1 }),
    bucket_name: fc.string({ minLength: 1 }),
    region: fc.string({ minLength: 1 }),
    is_active: fc.boolean(),
    created_at: fc.constantFrom(
      '2023-01-01T00:00:00.000Z',
      '2023-06-15T12:30:45.123Z',
      '2024-01-01T00:00:00.000Z',
      '2024-12-31T23:59:59.999Z'
    ),
    provider_name: fc.option(fc.string({ minLength: 1 })),
    is_default: fc.option(fc.boolean()),
    storage_limit_gb: fc.option(fc.integer({ min: 1, max: 10000 })),
    notes: fc.option(fc.string()),
    updated_at: fc.option(fc.constantFrom(
      '2023-01-01T00:00:00.000Z',
      '2023-06-15T12:30:45.123Z',
      '2024-01-01T00:00:00.000Z',
      '2024-12-31T23:59:59.999Z'
    )),
  });

  const createProviderRequestArb = fc.record({
    name: fc.string({ minLength: 1 }),
    provider_type: providerTypeArb,
    endpoint_url: fc.string({ minLength: 1 }),
    access_key: fc.string({ minLength: 1 }),
    secret_key: fc.string({ minLength: 1 }),
    bucket_name: fc.string({ minLength: 1 }),
    region: fc.string({ minLength: 1 }),
    provider_name: fc.option(fc.string({ minLength: 1 })),
    is_default: fc.option(fc.boolean()),
    storage_limit_gb: fc.option(fc.integer({ min: 1, max: 10000 })),
    notes: fc.option(fc.string()),
  });

  /**
   * Property 7: Provider List Filtering
   * **Validates: Requirements 5.6**
   * 
   * For any call to listProviders with is_active=true, all returned providers
   * should have is_active set to true.
   */
  describe('Property 7: Provider List Filtering', () => {
    it('should return only active providers when filtering by is_active=true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 2, maxLength: 10 }),
          async (providers) => {
            vi.clearAllMocks();
            
            // Create mixed providers ensuring we have at least one active and one inactive
            const mixedProviders = providers.map((provider, index) => ({
              ...provider,
              is_active: index < Math.ceil(providers.length / 2) // First half active, second half inactive
            }));
            
            // Filter to get only active providers for expected result
            const activeProviders = mixedProviders.filter(p => p.is_active);
            
            // Ensure we have at least one active provider
            expect(activeProviders.length).toBeGreaterThan(0);
            
            // Mock axios to return only active providers when filtered
            vi.mocked(axiosInstance.get).mockResolvedValueOnce({
              data: activeProviders
            });
            
            // Call listProviders with is_active=true filter
            const result = await listProviders({ is_active: true });
            
            // Verify all returned providers have is_active=true
            expect(result.every(provider => provider.is_active)).toBe(true);
            expect(result).toEqual(activeProviders);
            
            // Verify correct API call was made
            expect(axiosInstance.get).toHaveBeenCalledWith(
              '/api/v1/providers/',
              { params: { is_active: true } }
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only inactive providers when filtering by is_active=false', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(providerArb, { minLength: 2, maxLength: 10 }),
          async (providers) => {
            vi.clearAllMocks();
            
            // Create mixed providers ensuring we have at least one active and one inactive
            const mixedProviders = providers.map((provider, index) => ({
              ...provider,
              is_active: index < Math.ceil(providers.length / 2) // First half active, second half inactive
            }));
            
            // Filter to get only inactive providers for expected result
            const inactiveProviders = mixedProviders.filter(p => !p.is_active);
            
            // Ensure we have at least one inactive provider
            expect(inactiveProviders.length).toBeGreaterThan(0);
            
            // Mock axios to return only inactive providers when filtered
            vi.mocked(axiosInstance.get).mockResolvedValueOnce({
              data: inactiveProviders
            });
            
            // Call listProviders with is_active=false filter
            const result = await listProviders({ is_active: false });
            
            // Verify all returned providers have is_active=false
            expect(result.every(provider => !provider.is_active)).toBe(true);
            expect(result).toEqual(inactiveProviders);
            
            // Verify correct API call was made
            expect(axiosInstance.get).toHaveBeenCalledWith(
              '/api/v1/providers/',
              { params: { is_active: false } }
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Provider Activation State Change
   * **Validates: Requirements 5.7**
   * 
   * For any provider with is_active=false, calling activateProvider should
   * return a provider object with is_active=true.
   */
  describe('Property 8: Provider Activation State Change', () => {
    it('should change provider state from inactive to active', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb.map(provider => ({ ...provider, is_active: false })),
          async (inactiveProvider) => {
            vi.clearAllMocks();
            
            // Create the expected activated provider
            const activatedProvider: Provider = {
              ...inactiveProvider,
              is_active: true
            };
            
            // Mock axios to return the activated provider
            vi.mocked(axiosInstance.put).mockResolvedValueOnce({
              data: activatedProvider
            });
            
            // Call activateProvider
            const result = await activateProvider(inactiveProvider.id);
            
            // Verify the provider is now active
            expect(result.is_active).toBe(true);
            expect(result.id).toBe(inactiveProvider.id);
            expect(result).toEqual(activatedProvider);
            
            // Verify correct API call was made
            expect(axiosInstance.put).toHaveBeenCalledWith(
              `/api/v1/providers/${inactiveProvider.id}/activate`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Provider Deactivation State Change
   * **Validates: Requirements 5.8**
   * 
   * For any provider with is_active=true, calling deactivateProvider should
   * return a provider object with is_active=false.
   */
  describe('Property 9: Provider Deactivation State Change', () => {
    it('should change provider state from active to inactive', async () => {
      await fc.assert(
        fc.asyncProperty(
          providerArb.map(provider => ({ ...provider, is_active: true })),
          async (activeProvider) => {
            vi.clearAllMocks();
            
            // Create the expected deactivated provider
            const deactivatedProvider: Provider = {
              ...activeProvider,
              is_active: false
            };
            
            // Mock axios to return the deactivated provider
            vi.mocked(axiosInstance.put).mockResolvedValueOnce({
              data: deactivatedProvider
            });
            
            // Call deactivateProvider
            const result = await deactivateProvider(activeProvider.id);
            
            // Verify the provider is now inactive
            expect(result.is_active).toBe(false);
            expect(result.id).toBe(activeProvider.id);
            expect(result).toEqual(deactivatedProvider);
            
            // Verify correct API call was made
            expect(axiosInstance.put).toHaveBeenCalledWith(
              `/api/v1/providers/${activeProvider.id}/deactivate`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Serialization Round-Trip
   * **Validates: Requirements 7.3, 7.4, 7.5**
   * 
   * For any valid Provider object, serializing it to JSON and then deserializing
   * it back should produce an equivalent object with all fields preserved.
   */
  describe('Property 10: Serialization Round-Trip', () => {
    it('should preserve all fields through JSON round-trip', () => {
      fc.assert(
        fc.property(
          providerArb,
          (provider) => {
            // Serialize to JSON and deserialize back
            const serialized = JSON.stringify(provider);
            const deserialized = JSON.parse(serialized);
            
            // Verify all fields are preserved and objects are equivalent
            expect(deserialized).toEqual(provider);
            
            // Verify specific field preservation
            expect(deserialized.id).toBe(provider.id);
            expect(deserialized.name).toBe(provider.name);
            expect(deserialized.provider_type).toBe(provider.provider_type);
            expect(deserialized.endpoint_url).toBe(provider.endpoint_url);
            expect(deserialized.access_key).toBe(provider.access_key);
            expect(deserialized.secret_key).toBe(provider.secret_key);
            expect(deserialized.bucket_name).toBe(provider.bucket_name);
            expect(deserialized.region).toBe(provider.region);
            expect(deserialized.is_active).toBe(provider.is_active);
            expect(deserialized.created_at).toBe(provider.created_at);
            
            // Verify optional fields are preserved correctly
            expect(deserialized.provider_name).toBe(provider.provider_name);
            expect(deserialized.is_default).toBe(provider.is_default);
            expect(deserialized.storage_limit_gb).toBe(provider.storage_limit_gb);
            expect(deserialized.notes).toBe(provider.notes);
            expect(deserialized.updated_at).toBe(provider.updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle providers with all optional fields undefined', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            provider_type: providerTypeArb,
            endpoint_url: fc.webUrl(),
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
            is_active: fc.boolean(),
            created_at: fc.constantFrom(
              '2023-01-01T00:00:00.000Z',
              '2023-06-15T12:30:45.123Z',
              '2024-01-01T00:00:00.000Z',
              '2024-12-31T23:59:59.999Z'
            ),
            // All optional fields are undefined
          }),
          (provider) => {
            // Serialize to JSON and deserialize back
            const serialized = JSON.stringify(provider);
            const deserialized = JSON.parse(serialized);
            
            // Verify required fields are preserved
            expect(deserialized).toEqual(provider);
            
            // Verify optional fields are not present in serialized form
            expect(deserialized.provider_name).toBeUndefined();
            expect(deserialized.is_default).toBeUndefined();
            expect(deserialized.storage_limit_gb).toBeUndefined();
            expect(deserialized.notes).toBeUndefined();
            expect(deserialized.updated_at).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle providers with all optional fields populated', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            provider_type: providerTypeArb,
            endpoint_url: fc.webUrl(),
            access_key: fc.string({ minLength: 1 }),
            secret_key: fc.string({ minLength: 1 }),
            bucket_name: fc.string({ minLength: 1 }),
            region: fc.string({ minLength: 1 }),
            is_active: fc.boolean(),
            created_at: fc.constantFrom(
              '2023-01-01T00:00:00.000Z',
              '2023-06-15T12:30:45.123Z',
              '2024-01-01T00:00:00.000Z',
              '2024-12-31T23:59:59.999Z'
            ),
            // All optional fields are populated
            provider_name: fc.string({ minLength: 1 }),
            is_default: fc.boolean(),
            storage_limit_gb: fc.integer({ min: 1, max: 10000 }),
            notes: fc.string(),
            updated_at: fc.constantFrom(
              '2023-01-01T00:00:00.000Z',
              '2023-06-15T12:30:45.123Z',
              '2024-01-01T00:00:00.000Z',
              '2024-12-31T23:59:59.999Z'
            ),
          }),
          (provider) => {
            // Serialize to JSON and deserialize back
            const serialized = JSON.stringify(provider);
            const deserialized = JSON.parse(serialized);
            
            // Verify all fields are preserved
            expect(deserialized).toEqual(provider);
            
            // Verify optional fields are preserved with correct values
            expect(deserialized.provider_name).toBe(provider.provider_name);
            expect(deserialized.is_default).toBe(provider.is_default);
            expect(deserialized.storage_limit_gb).toBe(provider.storage_limit_gb);
            expect(deserialized.notes).toBe(provider.notes);
            expect(deserialized.updated_at).toBe(provider.updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});