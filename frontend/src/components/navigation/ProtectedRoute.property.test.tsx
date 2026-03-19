import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import ProtectedRoute from './ProtectedRoute';

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockUsePathname(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch for token refresh
global.fetch = vi.fn();

// Test data generators
const validTokenArbitrary = fc.string({ minLength: 10, maxLength: 100 });
const expiredTokenArbitrary = fc.string({ minLength: 10, maxLength: 100 });
const pathArbitrary = fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9-_/]/g, '')}`);
const redirectPathArbitrary = fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9-_/]/g, '')}`);

// Helper to create valid JWT-like token
const createValidToken = (expirationTime: number) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: 'user123', 
    exp: expirationTime,
    user: { id: 'user123', email: 'test@example.com' }
  }));
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
};

describe('ProtectedRoute Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockImplementation(() => {});
    mockUsePathname.mockReturnValue('/dashboard');
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  /**
   * **Feature: frontend-pages-and-navigation, Property 4: Route Protection**
   * 
   * For any protected route accessed by an unauthenticated user, the system 
   * should redirect to the login page.
   * 
   * **Validates: Requirements 1.7, 2.6**
   */
  it('Property 4: Route Protection - unauthenticated users are redirected to login', async () => {
    await fc.assert(
      fc.asyncProperty(
        pathArbitrary,
        redirectPathArbitrary,
        async (currentPath, redirectTo) => {
          // Setup: No authentication tokens
          localStorageMock.getItem.mockReturnValue(null);
          mockUsePathname.mockReturnValue(currentPath);

          const TestComponent = () => <div>Protected Content</div>;

          render(
            <ProtectedRoute redirectTo={redirectTo} requireAuth={true}>
              <TestComponent />
            </ProtectedRoute>
          );

          // Should show authentication required message initially
          await waitFor(() => {
            expect(screen.getAllByText('Authentication Required').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Redirecting to login page...').length).toBeGreaterThan(0);
          });

          // Should not show protected content
          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

          // Wait for redirect to be called
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith(redirectTo);
          });

          // Should store current path for redirect after login
          expect(sessionStorageMock.setItem).toHaveBeenCalledWith('redirectAfterLogin', currentPath);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 4: Route Protection - authenticated users can access protected routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        pathArbitrary,
        async (currentPath) => {
          // Setup: Valid authentication token
          const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
          const validToken = createValidToken(futureTime);
          
          localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'access_token') return validToken;
            if (key === 'refresh_token') return 'valid-refresh-token';
            return null;
          });
          
          mockUsePathname.mockReturnValue(currentPath);

          const TestComponent = () => <div>Protected Content</div>;

          render(
            <ProtectedRoute requireAuth={true}>
              <TestComponent />
            </ProtectedRoute>
          );

          // Should show loading initially
          await waitFor(() => {
            // Check if either loading text or protected content is present
            const hasLoadingOrContent = screen.queryByText('Checking Authentication') || 
                                      screen.queryByText('Protected Content');
            expect(hasLoadingOrContent).toBeTruthy();
          });

          // Wait for authentication check to complete
          await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Should not redirect
          expect(mockPush).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 4: Route Protection - expired tokens trigger refresh attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        pathArbitrary,
        async (currentPath) => {
          // Setup: Expired access token but valid refresh token
          const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
          const expiredToken = createValidToken(pastTime);
          
          localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'access_token') return expiredToken;
            if (key === 'refresh_token') return 'valid-refresh-token';
            return null;
          });

          // Mock successful token refresh
          const newToken = createValidToken(Math.floor(Date.now() / 1000) + 3600);
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: newToken,
              user: { id: 'user123', email: 'test@example.com' }
            }),
          });
          
          mockUsePathname.mockReturnValue(currentPath);

          const TestComponent = () => <div>Protected Content</div>;

          render(
            <ProtectedRoute requireAuth={true}>
              <TestComponent />
            </ProtectedRoute>
          );

          // Should show loading initially
          await waitFor(() => {
            // Check if either loading text or protected content is present
            const hasLoadingOrContent = screen.queryByText('Checking Authentication') || 
                                      screen.queryByText('Protected Content');
            expect(hasLoadingOrContent).toBeTruthy();
          });

          // Wait for token refresh and authentication
          await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Should have attempted token refresh
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: 'valid-refresh-token' }),
          });

          // Should have stored new token
          expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', newToken);

          // Should not redirect
          expect(mockPush).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 4: Route Protection - failed token refresh redirects to login', async () => {
    await fc.assert(
      fc.asyncProperty(
        pathArbitrary,
        redirectPathArbitrary,
        async (currentPath, redirectTo) => {
          // Setup: Expired access token and refresh fails
          const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
          const expiredToken = createValidToken(pastTime);
          
          localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'access_token') return expiredToken;
            if (key === 'refresh_token') return 'invalid-refresh-token';
            return null;
          });

          // Mock failed token refresh
          (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 401,
          });
          
          mockUsePathname.mockReturnValue(currentPath);

          const TestComponent = () => <div>Protected Content</div>;

          render(
            <ProtectedRoute redirectTo={redirectTo} requireAuth={true}>
              <TestComponent />
            </ProtectedRoute>
          );

          // Should show loading initially
          await waitFor(() => {
            // Check if either loading text or redirect message is present
            const hasLoadingOrRedirect = screen.queryByText('Checking Authentication') || 
                                        screen.queryByText('Authentication Required');
            expect(hasLoadingOrRedirect).toBeTruthy();
          });

          // Wait for failed refresh and redirect
          await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith(redirectTo);
          }, { timeout: 3000 });

          // Should have cleared tokens
          expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
          expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');

          // Should not show protected content
          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 4: Route Protection - non-required auth allows access without authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        pathArbitrary,
        async (currentPath) => {
          // Setup: No authentication tokens
          localStorageMock.getItem.mockReturnValue(null);
          mockUsePathname.mockReturnValue(currentPath);

          const TestComponent = () => <div>Public Content</div>;

          render(
            <ProtectedRoute requireAuth={false}>
              <TestComponent />
            </ProtectedRoute>
          );

          // Should show loading initially
          await waitFor(() => {
            // Check if either loading text or public content is present
            const hasLoadingOrContent = screen.queryByText('Checking Authentication') || 
                                      screen.queryByText('Public Content');
            expect(hasLoadingOrContent).toBeTruthy();
          });

          // Wait for authentication check to complete
          await waitFor(() => {
            expect(screen.getByText('Public Content')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Should not redirect
          expect(mockPush).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 30 }
    );
  });
});