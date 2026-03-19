import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { login, logout, register, isAuthenticated, getErrorMessage } from './auth.service';
import { getAccessToken, getRefreshToken, clearTokens, setAccessToken, setRefreshToken } from './storage.service';
import axiosInstance from '@/lib/axios';

// Mock the axios instance
vi.mock('@/lib/axios');

describe('Authentication Service - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear tokens and mocks before each test
    clearTokens();
    vi.clearAllMocks();
  });

  /**
   * Property 4: Token Storage on Successful Login
   * **Validates: Requirements 4.2**
   * 
   * For any successful login response containing access and refresh tokens,
   * both tokens should be stored in browser storage.
   */
  describe('Property 4: Token Storage on Successful Login', () => {
    it('should store both access and refresh tokens on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6 }),
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          async (email, password, accessToken, refreshToken) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Mock successful login response
            const mockResponse = {
              data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'bearer',
              },
            };

            vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

            // Call login function
            await login(email, password);

            // Verify both tokens are stored
            expect(getAccessToken()).toBe(accessToken);
            expect(getRefreshToken()).toBe(refreshToken);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should store tokens even when they are empty strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6 }),
          async (email, password) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Mock response with empty string tokens
            const mockResponse = {
              data: {
                access_token: '',
                refresh_token: '',
                token_type: 'bearer',
              },
            };

            vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

            // Call login function
            await login(email, password);

            // Verify both tokens are stored (even if empty)
            expect(getAccessToken()).toBe('');
            expect(getRefreshToken()).toBe('');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should replace previously stored tokens on new login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6 }),
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          async (email, password, accessToken, refreshToken) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // First login with initial tokens
            const firstResponse = {
              data: {
                access_token: accessToken + '_old',
                refresh_token: refreshToken + '_old',
                token_type: 'bearer',
              },
            };

            vi.mocked(axiosInstance.post).mockResolvedValueOnce(firstResponse);
            await login(email, password);

            // Verify old tokens are stored
            expect(getAccessToken()).toBe(accessToken + '_old');
            expect(getRefreshToken()).toBe(refreshToken + '_old');

            // Second login with new tokens
            const secondResponse = {
              data: {
                access_token: accessToken + '_new',
                refresh_token: refreshToken + '_new',
                token_type: 'bearer',
              },
            };

            vi.mocked(axiosInstance.post).mockResolvedValueOnce(secondResponse);
            await login(email, password);

            // Verify new tokens replaced old tokens
            expect(getAccessToken()).toBe(accessToken + '_new');
            expect(getRefreshToken()).toBe(refreshToken + '_new');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 5: Token Clearing on Logout
   * **Validates: Requirements 4.4**
   * 
   * For any application state with stored tokens, calling the logout function
   * should result in all tokens being cleared from storage.
   */
  describe('Property 5: Token Clearing on Logout', () => {
    it('should clear all tokens on successful logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          async (accessToken, refreshToken) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Store tokens
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            // Verify tokens are stored
            expect(getAccessToken()).toBe(accessToken);
            expect(getRefreshToken()).toBe(refreshToken);

            // Mock successful logout response
            vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: {} });

            // Call logout function
            await logout();

            // Verify all tokens are cleared
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should clear all tokens even when logout API call fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          fc.oneof(
            fc.constant(new Error('Network error')),
            fc.constant(new Error('Server error')),
            fc.constant(new Error('Timeout'))
          ),
          async (accessToken, refreshToken, error) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Store tokens
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            // Verify tokens are stored
            expect(getAccessToken()).toBe(accessToken);
            expect(getRefreshToken()).toBe(refreshToken);

            // Mock failed logout response
            vi.mocked(axiosInstance.post).mockRejectedValueOnce(error);

            // Call logout function - it will throw but tokens should still be cleared
            try {
              await logout();
            } catch {
              // Expected to throw, but tokens should still be cleared
            }

            // Verify all tokens are cleared even though API call failed
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should clear tokens when no tokens were stored', async () => {
      // Clear tokens and reset mocks
      clearTokens();
      vi.clearAllMocks();

      // Verify no tokens are stored
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();

      // Mock successful logout response
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: {} });

      // Call logout function
      await logout();

      // Verify tokens remain null
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should clear tokens when only one token is stored', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10 }),
          fc.boolean(),
          async (token, storeAccessToken) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Store only one token
            if (storeAccessToken) {
              setAccessToken(token);
            } else {
              setRefreshToken(token);
            }

            // Verify only one token is stored
            if (storeAccessToken) {
              expect(getAccessToken()).toBe(token);
              expect(getRefreshToken()).toBeNull();
            } else {
              expect(getAccessToken()).toBeNull();
              expect(getRefreshToken()).toBe(token);
            }

            // Mock successful logout response
            vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: {} });

            // Call logout function
            await logout();

            // Verify all tokens are cleared
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

  /**
   * Property 6: User Registration Success
   * **Validates: Requirements 1.5**
   * 
   * For any valid registration data, the register function should successfully
   * create a user account and return user information.
   */
  describe('Property 6: User Registration Success', () => {
    it('should successfully register a user with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.string({ minLength: 10 }),
          async (name, email, password, userId) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Mock successful registration response
            const mockResponse = {
              data: {
                id: userId,
                name,
                email,
                created_at: new Date().toISOString(),
              },
            };

            vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

            // Call register function
            const result = await register(name, email, password);

            // Verify the registration was called with correct data
            expect(axiosInstance.post).toHaveBeenCalledWith('/api/v1/users/register', {
              name,
              email,
              password,
            });

            // Verify the response matches expected format
            expect(result).toEqual({
              id: userId,
              name,
              email,
              created_at: expect.any(String),
            });

            // Verify no tokens are set during registration
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should clear tokens on registration failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.oneof(
            fc.constant(new Error('Email already exists')),
            fc.constant(new Error('Invalid email format')),
            fc.constant(new Error('Password too weak'))
          ),
          async (name, email, password, error) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Set some tokens to verify they get cleared
            setAccessToken('existing-token');
            setRefreshToken('existing-refresh-token');

            // Mock failed registration response
            vi.mocked(axiosInstance.post).mockRejectedValueOnce(error);

            // Call register function and expect it to throw
            await expect(register(name, email, password)).rejects.toThrow();

            // Verify tokens are cleared on failure
            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 7: Authentication State Utilities
   * **Validates: Requirements 10.1, 10.7**
   * 
   * For any authentication state, utility functions should correctly
   * identify whether the user is authenticated.
   */
  describe('Property 7: Authentication State Utilities', () => {
    it('should correctly identify authenticated state when both tokens exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          async (accessToken, refreshToken) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Set both tokens
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);

            // Verify authentication state is correctly identified
            expect(isAuthenticated()).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly identify unauthenticated state when tokens are missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({ access: null, refresh: null }),
            fc.constant({ access: 'token', refresh: null }),
            fc.constant({ access: null, refresh: 'token' })
          ),
          async (tokenState) => {
            // Clear tokens and reset mocks before each iteration
            clearTokens();
            vi.clearAllMocks();
            
            // Set tokens based on test case
            if (tokenState.access) setAccessToken(tokenState.access);
            if (tokenState.refresh) setRefreshToken(tokenState.refresh);

            // Verify authentication state is correctly identified
            const expectedAuth = !!(tokenState.access && tokenState.refresh);
            expect(isAuthenticated()).toBe(expectedAuth);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 8: Error Message Extraction
   * **Validates: Requirements 1.3, 8.4**
   * 
   * For any error that occurs during authentication operations,
   * the system should extract and return meaningful error messages.
   */
  describe('Property 8: Error Message Extraction', () => {
    it('should extract error messages from various error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string({ minLength: 1 }).map(msg => new Error(msg)),
            fc.string({ minLength: 1 }).map(msg => ({ message: msg })),
            fc.string({ minLength: 1 }).map(msg => ({ detail: msg })),
            fc.constant({ message: 'Network error: Unable to reach the server' })
          ),
          async (error) => {
            const errorMessage = getErrorMessage(error);
            
            // Verify error message is extracted correctly
            expect(typeof errorMessage).toBe('string');
            expect(errorMessage.length).toBeGreaterThan(0);
            expect(errorMessage).not.toBe('undefined');
            expect(errorMessage).not.toBe('null');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide fallback message for unknown error types', () => {
      const unknownError = { someProperty: 'value' };
      const errorMessage = getErrorMessage(unknownError);
      
      expect(errorMessage).toBe('An unexpected error occurred');
    });
  });