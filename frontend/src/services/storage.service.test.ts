import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from './storage.service';

describe('Token Storage Service - Property-Based Tests', () => {
  /**
   * Property 12: Token Storage Round Trip
   * **Validates: Requirements 9.1, 9.2, 9.3**
   * 
   * For any token string, storing it using setAccessToken or setRefreshToken
   * and then retrieving it using the corresponding get function should return
   * the same token value.
   */
  describe('Property 12: Token Storage Round Trip', () => {
    it('should return the same access token after storing and retrieving', () => {
      fc.assert(
        fc.property(fc.string(), (token) => {
          // Store the token
          setAccessToken(token);
          
          // Retrieve the token
          const retrieved = getAccessToken();
          
          // The retrieved token should match the stored token
          expect(retrieved).toBe(token);
        }),
        { numRuns: 20 }
      );
    });

    it('should return the same refresh token after storing and retrieving', () => {
      fc.assert(
        fc.property(fc.string(), (token) => {
          // Store the token
          setRefreshToken(token);
          
          // Retrieve the token
          const retrieved = getRefreshToken();
          
          // The retrieved token should match the stored token
          expect(retrieved).toBe(token);
        }),
        { numRuns: 20 }
      );
    });

    it('should handle storing and retrieving both tokens independently', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (accessToken, refreshToken) => {
          // Store both tokens
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          
          // Retrieve both tokens
          const retrievedAccess = getAccessToken();
          const retrievedRefresh = getRefreshToken();
          
          // Both tokens should match their stored values
          expect(retrievedAccess).toBe(accessToken);
          expect(retrievedRefresh).toBe(refreshToken);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 13: Token Clearing Completeness
   * **Validates: Requirements 9.4**
   * 
   * For any application state with stored access and refresh tokens,
   * calling clearTokens should result in both getAccessToken and
   * getRefreshToken returning null.
   */
  describe('Property 13: Token Clearing Completeness', () => {
    it('should clear both access and refresh tokens', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (accessToken, refreshToken) => {
          // Store both tokens
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          
          // Clear all tokens
          clearTokens();
          
          // Both tokens should now be null
          expect(getAccessToken()).toBeNull();
          expect(getRefreshToken()).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should handle clearing tokens when only access token is set', () => {
      fc.assert(
        fc.property(fc.string(), (accessToken) => {
          // Store only access token
          setAccessToken(accessToken);
          
          // Clear all tokens
          clearTokens();
          
          // Access token should be null
          expect(getAccessToken()).toBeNull();
          expect(getRefreshToken()).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should handle clearing tokens when only refresh token is set', () => {
      fc.assert(
        fc.property(fc.string(), (refreshToken) => {
          // Store only refresh token
          setRefreshToken(refreshToken);
          
          // Clear all tokens
          clearTokens();
          
          // Both tokens should be null
          expect(getAccessToken()).toBeNull();
          expect(getRefreshToken()).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should be idempotent - clearing already cleared tokens', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Clear tokens (may already be cleared)
          clearTokens();
          
          // Clear again
          clearTokens();
          
          // Both tokens should still be null
          expect(getAccessToken()).toBeNull();
          expect(getRefreshToken()).toBeNull();
        }),
        { numRuns: 20 }
      );
    });
  });
});
