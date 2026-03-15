import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { login, logout } from './auth.service';
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
