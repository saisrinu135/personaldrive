import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import * as storageService from '@/services/storage.service';
import { User, LoginResponse } from '@/types/auth.types';
import { RegisterResponse } from '@/types/user.types';

// Mock the services
vi.mock('@/services/auth.service');
vi.mock('@/services/user.service');
vi.mock('@/services/storage.service');

const mockAuthService = vi.mocked(authService);
const mockUserService = vi.mocked(userService);
const mockStorageService = vi.mocked(storageService);

// Test component that uses the auth context for authentication flows
const AuthFlowTestComponent: React.FC = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    register, 
    logout, 
    clearError 
  } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      await register(name, email, password);
    } catch (error) {
      // Error is handled by the context
    }
  };

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="email">{user ? user.email : 'No email'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'No error'}</div>
      
      <button 
        data-testid="login-btn"
        onClick={() => handleLogin('valid@example.com', 'validpassword')}
      >
        Login Valid
      </button>
      
      <button 
        data-testid="login-invalid-btn"
        onClick={() => handleLogin('invalid@example.com', 'wrongpassword')}
      >
        Login Invalid
      </button>
      
      <button 
        data-testid="register-btn"
        onClick={() => handleRegister('Test User', 'test@example.com', 'password123')}
      >
        Register Valid
      </button>
      
      <button 
        data-testid="register-invalid-btn"
        onClick={() => handleRegister('', 'invalid-email', 'weak')}
      >
        Register Invalid
      </button>
      
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      
      <button data-testid="clear-error-btn" onClick={clearError}>
        Clear Error
      </button>
    </div>
  );
};

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <AuthFlowTestComponent />
    </AuthProvider>
  );
};

// Generators for property-based testing
const validUserArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
});

const tokenArbitrary = fc.string({ minLength: 10, maxLength: 200 });

const authErrorArbitrary = fc.oneof(
  fc.constant('Invalid credentials'),
  fc.constant('User not found'),
  fc.constant('Account locked'),
  fc.constant('Network error'),
  fc.constant('Server error'),
  fc.constant('Authentication failed')
);

describe('Authentication Flow Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset storage mocks to return null by default (unauthenticated state)
    mockStorageService.getAccessToken.mockReturnValue(null);
    mockStorageService.getRefreshToken.mockReturnValue(null);
    // Mock storage operations
    mockStorageService.setAccessToken.mockImplementation(() => {});
    mockStorageService.setRefreshToken.mockImplementation(() => {});
    mockStorageService.clearTokens.mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 1: Authentication Flow Success
   * For any valid user credentials, submitting them through the login form 
   * should authenticate the user and redirect to the dashboard.
   * 
   * **Validates: Requirements 1.2**
   */
  it('Property 1: Authentication Flow Success - valid credentials should authenticate user', async () => {
    // Test with fixed data first to ensure basic functionality works
    const user = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    const mockLoginResponse: LoginResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
    };

    mockAuthService.login.mockResolvedValue(mockLoginResponse);
    mockAuthService.getCurrentUser.mockResolvedValue(user);

    // Act: Render component and perform login
    renderWithAuthProvider();

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 1000 });

    // Perform login action
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    // Assert: User should be authenticated successfully
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(user.name);
      expect(screen.getByTestId('email')).toHaveTextContent(user.email);
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 1000 });

    // Verify service calls
    expect(mockAuthService.login).toHaveBeenCalledWith('valid@example.com', 'validpassword');
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  }, 5000);

  it('Property 1: Authentication Flow Success - property-based test with multiple valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserArbitrary,
        tokenArbitrary,
        tokenArbitrary,
        async (user, accessToken, refreshToken) => {
          // Setup: Mock successful authentication
          const mockLoginResponse: LoginResponse = {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
          };

          mockAuthService.login.mockResolvedValue(mockLoginResponse);
          mockAuthService.getCurrentUser.mockResolvedValue(user);

          // Act: Render component and perform login
          renderWithAuthProvider();

          // Wait for initial loading to complete
          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Perform login action
          await act(async () => {
            screen.getByTestId('login-btn').click();
          });

          // Assert: User should be authenticated successfully
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
            expect(screen.getByTestId('user')).toHaveTextContent(user.name);
            expect(screen.getByTestId('email')).toHaveTextContent(user.email);
            expect(screen.getByTestId('error')).toHaveTextContent('No error');
          }, { timeout: 500 });

          // Verify service calls
          expect(mockAuthService.login).toHaveBeenCalledWith('valid@example.com', 'validpassword');
          expect(mockAuthService.getCurrentUser).toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 5000);

  /**
   * Property 2: Authentication Error Handling
   * For any invalid credentials submitted through authentication forms, 
   * the system should display appropriate error messages without redirecting.
   * 
   * **Validates: Requirements 1.3**
   */
  it('Property 2: Authentication Error Handling - invalid credentials should show error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        authErrorArbitrary,
        async (errorMessage) => {
          // Setup: Mock authentication failure
          mockAuthService.login.mockRejectedValue(new Error(errorMessage));

          // Act: Render component and perform login with invalid credentials
          renderWithAuthProvider();

          // Wait for initial loading to complete
          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Perform login action with invalid credentials
          await act(async () => {
            screen.getByTestId('login-invalid-btn').click();
          });

          // Assert: Should show error message and remain unauthenticated
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
            expect(screen.getByTestId('email')).toHaveTextContent('No email');
            expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Verify service calls
          expect(mockAuthService.login).toHaveBeenCalledWith('invalid@example.com', 'wrongpassword');
          expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 5000);

  it('Property 2: Authentication Error Handling - network errors should be handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('Network error'),
          fc.constant('Unable to reach the server'),
          fc.constant('Connection timeout'),
          fc.constant('Server unavailable')
        ),
        async (networkError) => {
          // Setup: Mock network failure
          const error = new Error(networkError);
          mockAuthService.login.mockRejectedValue(error);

          // Act: Render component and attempt login
          renderWithAuthProvider();

          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          await act(async () => {
            screen.getByTestId('login-btn').click();
          });

          // Assert: Should handle network error gracefully
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('error')).toHaveTextContent(networkError);
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 5000);

  it('Property 1: Authentication Flow Success - registration should authenticate user automatically', async () => {
    // Test registration flow with fixed data
    const user = {
      id: '2',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockRegisterResponse: RegisterResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const mockLoginResponse: LoginResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
    };

    mockUserService.register.mockResolvedValue(mockRegisterResponse);
    mockAuthService.login.mockResolvedValue(mockLoginResponse);
    mockAuthService.getCurrentUser.mockResolvedValue(user);

    // Act: Render component and perform registration
    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 1000 });

    await act(async () => {
      screen.getByTestId('register-btn').click();
    });

    // Assert: User should be registered and authenticated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(user.name);
      expect(screen.getByTestId('email')).toHaveTextContent(user.email);
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    }, { timeout: 1000 });

    // Verify service calls
    expect(mockUserService.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  }, 5000);

  it('Property 2: Authentication Error Handling - registration errors should be displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('Email already exists'),
          fc.constant('Invalid email format'),
          fc.constant('Password too weak'),
          fc.constant('Registration failed'),
          fc.constant('Server error')
        ),
        async (errorMessage) => {
          // Setup: Mock registration failure
          mockUserService.register.mockRejectedValue(new Error(errorMessage));

          // Act: Render component and attempt registration
          renderWithAuthProvider();

          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          await act(async () => {
            screen.getByTestId('register-invalid-btn').click();
          });

          // Assert: Should show error and remain unauthenticated
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
            expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
          }, { timeout: 500 });

          // Verify registration was attempted but login was not called
          expect(mockUserService.register).toHaveBeenCalled();
          expect(mockAuthService.login).not.toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 5000);

  it('Property 2: Authentication Error Handling - error clearing should work correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        authErrorArbitrary,
        async (errorMessage) => {
          // Setup: Mock authentication failure
          mockAuthService.login.mockRejectedValue(new Error(errorMessage));

          // Act: Render component, cause error, then clear it
          renderWithAuthProvider();

          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Cause error
          await act(async () => {
            screen.getByTestId('login-invalid-btn').click();
          });

          // Verify error is shown
          await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
          }, { timeout: 500 });

          // Clear error
          await act(async () => {
            screen.getByTestId('clear-error-btn').click();
          });

          // Assert: Error should be cleared
          await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('No error');
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3 }
    );
  }, 5000);
});