import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { login, register } from './auth.service';
import * as storageService from './storage.service';
import axiosInstance from '@/lib/axios';

// Mock the axios instance and storage service
vi.mock('@/lib/axios');
vi.mock('./storage.service');

const mockStorageService = vi.mocked(storageService);
const mockAxiosInstance = vi.mocked(axiosInstance);

describe('Authentication Flows - Property-Based Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockStorageService.clearTokens.mockImplementation(() => {});
    mockStorageService.setAccessToken.mockImplementation(() => {});
    mockStorageService.setRefreshToken.mockImplementation(() => {});
    mockStorageService.getAccessToken.mockReturnValue(null);
    mockStorageService.getRefreshToken.mockReturnValue(null);
  });

  /**
   * Property 1: Authentication Flow Success
   * **Validates: Requirements 1.2**
   * 
   * For any valid user credentials, submitting them through the login form 
   * should authenticate the user and redirect to the dashboard.
   */
  describe('Property 1: Authentication Flow Success', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (email, password, accessToken, refreshToken) => {
            // Reset mocks before each iteration
            vi.clearAllMocks();
            mockStorageService.clearTokens.mockImplementation(() => {});
            mockStorageService.setAccessToken.mockImplementation(() => {});
            mockStorageService.setRefreshToken.mockImplementation(() => {});
            
            // Mock successful login response
            const mockLoginResponse = {
              data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'bearer',
              },
            };

            mockAxiosInstance.post.mockResolvedValueOnce(mockLoginResponse);

            // Call login function
            const result = await login(email, password);

            // Verify the login was called with correct credentials
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/auth/login', {
              email,
              password,
            });

            // Verify the response contains the expected tokens
            expect(result).toEqual({
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'bearer',
            });

            // Verify tokens are stored for authenticated session
            expect(mockStorageService.setAccessToken).toHaveBeenCalledWith(accessToken);
            expect(mockStorageService.setRefreshToken).toHaveBeenCalledWith(refreshToken);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 2: Authentication Error Handling
   * **Validates: Requirements 1.3**
   * 
   * For any invalid credentials submitted through authentication forms, 
   * the system should display appropriate error messages without redirecting.
   */
  describe('Property 2: Authentication Error Handling', () => {
    it('should handle authentication errors without storing tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.record({
              message: fc.constant('Invalid credentials'),
              status: fc.constant(401),
            }),
            fc.record({
              message: fc.constant('User not found'),
              status: fc.constant(404),
            })
          ),
          async (email, password, errorResponse) => {
            // Reset mocks before each iteration
            vi.clearAllMocks();
            mockStorageService.clearTokens.mockImplementation(() => {});
            
            // Mock failed login response
            const mockError = {
              response: {
                status: errorResponse.status,
                data: { detail: errorResponse.message },
              },
              message: errorResponse.message,
            };

            mockAxiosInstance.post.mockRejectedValueOnce(mockError);

            // Call login function and expect it to throw
            await expect(login(email, password)).rejects.toThrow();

            // Verify tokens are cleared on authentication failure
            expect(mockStorageService.clearTokens).toHaveBeenCalled();

            // Verify login was attempted with provided credentials
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/auth/login', {
              email,
              password,
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 3: Registration Flow Success
   * **Validates: Requirements 1.5**
   * 
   * For any valid registration data, submitting it through the registration form 
   * should create a new user account and authenticate the user.
   */
  describe('Property 3: Registration Flow Success', () => {
    it('should successfully register user with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 100 }),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.string({ minLength: 10 }),
          async (name, email, password, userId) => {
            // Reset mocks before each iteration
            vi.clearAllMocks();
            mockStorageService.clearTokens.mockImplementation(() => {});
            
            // Mock successful registration response
            const mockRegistrationResponse = {
              data: {
                id: userId,
                name,
                email,
                created_at: new Date().toISOString(),
              },
            };

            mockAxiosInstance.post.mockResolvedValueOnce(mockRegistrationResponse);

            // Call register function
            const result = await register(name, email, password);

            // Verify the registration was called with correct data
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/users/register', {
              name,
              email,
              password,
            });

            // Verify the response contains user information
            expect(result).toEqual({
              id: userId,
              name,
              email,
              created_at: expect.any(String),
            });

            // Verify no tokens are set during registration (tokens come from subsequent login)
            expect(mockStorageService.setAccessToken).not.toHaveBeenCalled();
            expect(mockStorageService.setRefreshToken).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle registration errors appropriately', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2 }),
          fc.emailAddress(),
          fc.string({ minLength: 6 }),
          fc.oneof(
            fc.record({
              message: fc.constant('Email already exists'),
              status: fc.constant(409),
            }),
            fc.record({
              message: fc.constant('Invalid email format'),
              status: fc.constant(400),
            })
          ),
          async (name, email, password, errorResponse) => {
            // Reset mocks before each iteration
            vi.clearAllMocks();
            mockStorageService.clearTokens.mockImplementation(() => {});
            
            // Mock failed registration response
            const mockError = {
              response: {
                status: errorResponse.status,
                data: { detail: errorResponse.message },
              },
              message: errorResponse.message,
            };

            mockAxiosInstance.post.mockRejectedValueOnce(mockError);

            // Call register function and expect it to throw
            await expect(register(name, email, password)).rejects.toThrow();

            // Verify tokens are cleared on registration failure
            expect(mockStorageService.clearTokens).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});