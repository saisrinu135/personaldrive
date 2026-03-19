import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '@/services/auth.service';
import * as storageService from '@/services/storage.service';

// Mock the services
vi.mock('@/services/auth.service');
vi.mock('@/services/storage.service');

const mockAuthService = vi.mocked(authService);
const mockStorageService = vi.mocked(storageService);

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
    </div>
  );
};

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

// Generators for property-based testing
const userArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
});

const tokenArbitrary = fc.string({ minLength: 10, maxLength: 200 });

describe('AuthContext Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 34: Authentication Persistence
   * For any valid user authentication, the authentication state should be 
   * persisted in browser storage and restored on application reload.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('Property 34: Authentication Persistence - should persist and restore authentication state', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        tokenArbitrary,
        tokenArbitrary,
        async (user, accessToken, refreshToken) => {
          // Setup: Mock storage to return the tokens
          mockStorageService.getAccessToken.mockReturnValue(accessToken);
          mockStorageService.getRefreshToken.mockReturnValue(refreshToken);
          mockAuthService.getCurrentUser.mockResolvedValue(user);

          // Act: Render the component (simulating app reload)
          renderWithAuthProvider();

          // Assert: Authentication state should be restored
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent(user.name);
          }, { timeout: 2000 });

          // Verify that storage was checked for tokens
          expect(mockStorageService.getAccessToken).toHaveBeenCalled();
          expect(mockStorageService.getRefreshToken).toHaveBeenCalled();
          expect(mockAuthService.getCurrentUser).toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 5 }
    );
  }, 10000);

  it('Property 34: Authentication Persistence - should handle missing tokens correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(null, undefined, ''),
        fc.constantFrom(null, undefined, ''),
        async (accessToken, refreshToken) => {
          // Setup: Mock storage to return null/empty tokens
          mockStorageService.getAccessToken.mockReturnValue(accessToken as string | null);
          mockStorageService.getRefreshToken.mockReturnValue(refreshToken as string | null);

          // Act: Render the component
          renderWithAuthProvider();

          // Assert: Should be unauthenticated
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
          }, { timeout: 2000 });

          // Verify that storage was checked
          expect(mockStorageService.getAccessToken).toHaveBeenCalled();
          expect(mockStorageService.getRefreshToken).toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 10000);

  it('Property 34: Authentication Persistence - should handle token refresh on expired tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        tokenArbitrary,
        tokenArbitrary,
        tokenArbitrary,
        async (user, expiredToken, refreshToken, newToken) => {
          // Setup: Mock storage and services
          mockStorageService.getAccessToken.mockReturnValue(expiredToken);
          mockStorageService.getRefreshToken.mockReturnValue(refreshToken);
          
          // First call fails (expired token), second succeeds after refresh
          mockAuthService.getCurrentUser
            .mockRejectedValueOnce(new Error('Token expired'))
            .mockResolvedValueOnce(user);
          
          mockAuthService.refreshToken.mockResolvedValue(newToken);

          // Act: Render the component
          renderWithAuthProvider();

          // Assert: Should successfully authenticate after refresh
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
            expect(screen.getByTestId('user')).toHaveTextContent(user.name);
          }, { timeout: 2000 });

          // Verify refresh was attempted
          expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshToken);

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 10000);

  it('Property 34: Authentication Persistence - should clear state when refresh fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArbitrary,
        tokenArbitrary,
        async (expiredToken, invalidRefreshToken) => {
          // Setup: Mock storage and failing services
          mockStorageService.getAccessToken.mockReturnValue(expiredToken);
          mockStorageService.getRefreshToken.mockReturnValue(invalidRefreshToken);
          
          mockAuthService.getCurrentUser.mockRejectedValue(new Error('Token expired'));
          mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

          // Act: Render the component
          renderWithAuthProvider();

          // Assert: Should be unauthenticated and tokens cleared
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
          }, { timeout: 2000 });

          // Verify tokens were cleared
          expect(mockStorageService.clearTokens).toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 10000);
});