# Requirements Document

## Introduction

This document specifies the requirements for integrating provider API endpoints in the frontend application. The backend already provides REST API endpoints for managing storage providers (Oracle, AWS, Cloudflare, etc.). The frontend needs TypeScript type definitions, service functions, client-side validation, and property-based tests to interact with these endpoints following the existing patterns established by the auth and user services.

## Glossary

- **Provider_Service**: The frontend service module that encapsulates all API calls to provider endpoints
- **Provider_Type**: An enumeration of supported storage provider types (oracle, aws, cloudflare, others)
- **Provider**: A storage provider configuration containing credentials, endpoint URL, and metadata
- **Provider_Request**: Data structure for creating or updating a provider
- **Provider_Response**: Data structure returned from the backend API for provider operations
- **Connection_Test**: An operation that validates provider credentials without persisting the provider
- **Validation_Function**: A client-side function that validates provider data before sending to the backend
- **Property_Test**: A property-based test that validates service correctness using generated test data
- **HTTP_Client**: The configured Axios instance with authentication interceptors

## Requirements

### Requirement 1: Provider Type Definitions

**User Story:** As a developer, I want TypeScript type definitions for provider data, so that I have type safety and autocompletion when working with provider objects.

#### Acceptance Criteria

1. THE Provider_Service SHALL define a ProviderType enum containing "oracle", "aws", "cloudflare", and "others"
2. THE Provider_Service SHALL define a Provider interface with id (string), name (string), provider_type (ProviderType), endpoint_url (string), access_key (string), secret_key (string), bucket_name (string), region (string), is_active (boolean), created_at (string), and optional fields provider_name (string), is_default (boolean), storage_limit_gb (number), notes (string), and updated_at (string)
3. THE Provider_Service SHALL define a CreateProviderRequest interface excluding id, created_at, updated_at, and is_active fields
4. THE Provider_Service SHALL define a TestConnectionRequest interface with the same fields as CreateProviderRequest
5. THE Provider_Service SHALL define a TestConnectionResponse interface with success (boolean) and message (string) fields
6. THE Provider_Service SHALL define a ListProvidersParams interface with optional is_active (boolean) field

### Requirement 2: Provider Service API Functions

**User Story:** As a developer, I want service functions to call provider API endpoints, so that I can manage storage providers from the frontend application.

#### Acceptance Criteria

1. THE Provider_Service SHALL provide a testConnection function that accepts TestConnectionRequest and returns Promise<TestConnectionResponse>
2. WHEN testConnection is called, THE Provider_Service SHALL send a POST request to "/api/v1/providers/test-connection"
3. THE Provider_Service SHALL provide a createProvider function that accepts CreateProviderRequest and returns Promise<Provider>
4. WHEN createProvider is called, THE Provider_Service SHALL send a POST request to "/api/v1/providers/"
5. THE Provider_Service SHALL provide a listProviders function that accepts optional ListProvidersParams and returns Promise<Provider[]>
6. WHEN listProviders is called, THE Provider_Service SHALL send a GET request to "/api/v1/providers/" with query parameters
7. THE Provider_Service SHALL provide an activateProvider function that accepts provider_id (string) and returns Promise<Provider>
8. WHEN activateProvider is called, THE Provider_Service SHALL send a PUT request to "/api/v1/providers/{provider_id}/activate"
9. THE Provider_Service SHALL provide a deactivateProvider function that accepts provider_id (string) and returns Promise<Provider>
10. WHEN deactivateProvider is called, THE Provider_Service SHALL send a PUT request to "/api/v1/providers/{provider_id}/deactivate"
11. THE Provider_Service SHALL use the configured HTTP_Client for all API requests
12. WHEN any API request fails, THE Provider_Service SHALL propagate the formatted error from the HTTP_Client

### Requirement 3: Endpoint URL Validation

**User Story:** As a developer, I want to validate endpoint URLs before sending requests, so that I can provide immediate feedback for invalid URLs.

#### Acceptance Criteria

1. THE Provider_Service SHALL provide a validateEndpointUrl function that accepts a url (string) and returns boolean
2. WHEN validateEndpointUrl receives a URL starting with "http://", THE Provider_Service SHALL return true
3. WHEN validateEndpointUrl receives a URL starting with "https://", THE Provider_Service SHALL return true
4. WHEN validateEndpointUrl receives a URL not starting with "http://" or "https://", THE Provider_Service SHALL return false
5. WHEN validateEndpointUrl receives an empty string, THE Provider_Service SHALL return false

### Requirement 4: Required Fields Validation

**User Story:** As a developer, I want to validate required provider fields before API calls, so that I can catch missing data early and provide clear error messages.

#### Acceptance Criteria

1. THE Provider_Service SHALL provide a validateProviderData function that accepts CreateProviderRequest and returns boolean
2. WHEN validateProviderData receives data with all required fields populated, THE Provider_Service SHALL return true
3. WHEN validateProviderData receives data with any required field empty or undefined, THE Provider_Service SHALL return false
4. THE Provider_Service SHALL treat name, provider_type, endpoint_url, access_key, secret_key, bucket_name, and region as required fields
5. WHEN createProvider is called with invalid data, THE Provider_Service SHALL throw an error before making the API request
6. WHEN testConnection is called with invalid data, THE Provider_Service SHALL throw an error before making the API request

### Requirement 5: Property-Based Testing for Service Functions

**User Story:** As a developer, I want property-based tests for the provider service, so that I can verify correctness across a wide range of inputs and catch edge cases.

#### Acceptance Criteria

1. THE Property_Test SHALL generate random valid Provider objects and verify they satisfy the Provider interface constraints
2. THE Property_Test SHALL generate random CreateProviderRequest objects and verify validateProviderData returns true for complete data
3. THE Property_Test SHALL generate random incomplete CreateProviderRequest objects and verify validateProviderData returns false
4. THE Property_Test SHALL verify that validateEndpointUrl returns true for all URLs starting with "http://" or "https://"
5. THE Property_Test SHALL verify that validateEndpointUrl returns false for all URLs not starting with "http://" or "https://"
6. THE Property_Test SHALL verify that listProviders with is_active=true filter only returns providers where is_active is true
7. THE Property_Test SHALL verify that activating a provider changes is_active from false to true
8. THE Property_Test SHALL verify that deactivating a provider changes is_active from true to false

### Requirement 6: Service Integration with Existing Patterns

**User Story:** As a developer, I want the provider service to follow the same patterns as existing services, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Provider_Service SHALL be implemented in a file named "provider.service.ts" in the "src/services/" directory
2. THE Provider_Service SHALL import the HTTP_Client from "@/lib/axios"
3. THE Provider_Service SHALL export individual functions rather than a class or object
4. THE Provider_Service SHALL place validation functions before API functions in the file
5. THE Provider_Service SHALL define TypeScript types in a file named "provider.types.ts" in the "src/types/" directory
6. THE Provider_Service SHALL place property-based tests in a file named "provider.service.test.ts" in the "src/services/" directory
7. WHEN the HTTP_Client returns formatted errors, THE Provider_Service SHALL propagate them without additional wrapping

### Requirement 7: Parser and Serializer for Provider Data

**User Story:** As a developer, I want to ensure provider data is correctly serialized and deserialized, so that data integrity is maintained across API calls.

#### Acceptance Criteria

1. THE Provider_Service SHALL correctly serialize CreateProviderRequest objects to JSON for POST requests
2. THE Provider_Service SHALL correctly deserialize Provider objects from JSON responses
3. THE Property_Test SHALL verify that for all valid Provider objects, serializing to JSON and deserializing back produces an equivalent object (round-trip property)
4. THE Property_Test SHALL verify that optional fields (provider_name, is_default, storage_limit_gb, notes, updated_at) are correctly handled when undefined
5. WHEN a Provider object contains all optional fields, THE Property_Test SHALL verify round-trip serialization preserves all values
6. WHEN a Provider object contains no optional fields, THE Property_Test SHALL verify round-trip serialization preserves required values and omits optional fields

