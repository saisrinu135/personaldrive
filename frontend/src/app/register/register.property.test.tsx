import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as userService from '@/services/user.service';
import * as authService from '@/services/auth.service';
import * as storageService from '@/services/storage.service';
import { User, LoginResponse } from '@/types/auth.types';
import { RegisterResponse } from '@/types/user.types';

// Mock the services
vi.mock('@/services/user.service');
vi.mock('@/services/auth.service');
vi.mock('@/services/storage.service');

const mockUserService = vi.mocked(userService);
const mockAuthService = vi.mocked(authService);
const mockStorageService = vi.mocked(storageService);

// Test component that uses the auth context for registration flows
const RegistrationFlowTestComponent: React.FC<{
  name: string;
  email: string;
  password: string;
  onRegister: () => void;
}> = ({ name, email, password, onRegister }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    register 
  } = useAuth();

  const handleRegister = async () => {
    try {
      await register(name, email, password);
      onRegister();
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
        data-testid="register-btn"
        onClick={handleRegister}
      >
        Register
      </button>
    </div>
  );
};

const renderWithAuthProvider = (name: string, email: string, password: string, onRegister: () => void) => {
  return render(
    <AuthProvider>
      <RegistrationFlowTestComponent 
        name={name}
        email={email}
        password={password}
        onRegister={onRegister}
      />
    </AuthProvider>
  );
};

// Generators for property-based testing
const validNameArbitrary = fc.string({ minLength: 2, maxLength: 100 }).filter(name => 
  name.trim().length >= 2 && !/^\s|\s$/.test(name) && /^[a-zA-Z\s\-']+$/.test(name)
);

const validEmailArbitrary = fc.emailAddress();

const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 }).filter(password => 
  /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
);

const validRegistrationDataArbitrary = fc.record({
  name: validNameArbitrary,
  email: validEmailArbitrary,
  password: validPasswordArbitrary,
});

const validUserArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: validNameArbitrary,
  email: validEmailArbitrary,
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
});

describe('Registration Flow Property Tests', () => {
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
   * Property 3: Registration Flow Success
   * For any valid registration data, submitting it through the registration form 
   * should create a new user account and authenticate the user.
   * 
   * **Validates: Requirements 1.5**
   */
  it('Property 3: Registration Flow Success - valid registration data should create account and authenticate user', async () => {
    // Test with fixed data first to ensure basic functionality works
    const registrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPass123',
    };

    const expectedUser: User = {
      id: '1',
      name: registrationData.name,
      email: registrationData.email,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockRegisterResponse: RegisterResponse = {
      id: expectedUser.id,
      name: expectedUser.name,
      email: expectedUser.email,
      created_at: expectedUser.created_at,
    };

    const mockLoginResponse: LoginResponse = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
    };

    // Mock successful registration and login
    mockUserService.register.mockResolvedValue(mockRegisterResponse);
    mockAuthService.login.mockResolvedValue(mockLoginResponse);
    mockAuthService.getCurrentUser.mockResolvedValue(expectedUser);

    const onRegisterSpy = vi.fn();

    // Act: Render component and perform registration
    renderWithAuthProvider(
      registrationData.name,
      registrationData.email,
      registrationData.password,
      onRegisterSpy
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 1000 });

    // Perform registration action
    const registerButton = screen.getByTestId('register-btn');
    registerButton.click();

    // Assert: User should be registered and authenticated successfully
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(expectedUser.name);
      expect(screen.getByTestId('email')).toHaveTextContent(expectedUser.email);
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 2000 });

    // Verify service calls
    expect(mockUserService.register).toHaveBeenCalledWith({
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
    });
    expect(mockAuthService.login).toHaveBeenCalledWith(registrationData.email, registrationData.password);
    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    expect(onRegisterSpy).toHaveBeenCalled();
  }, 10000);

  it('Property 3: Registration Flow Success - property-based test with multiple valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        validRegistrationDataArbitrary,
        validUserArbitrary,
        async (registrationData, expectedUser) => {
          // Ensure the user data matches the registration data
          const user = {
            ...expectedUser,
            name: registrationData.name,
            email: registrationData.email,
          };

          const mockRegisterResponse: RegisterResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          };

          const mockLoginResponse: LoginResponse = {
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
            token_type: 'Bearer',
          };

          // Mock successful registration and login
          mockUserService.register.mockResolvedValue(mockRegisterResponse);
          mockAuthService.login.mockResolvedValue(mockLoginResponse);
          mockAuthService.getCurrentUser.mockResolvedValue(user);

          const onRegisterSpy = vi.fn();

          // Act: Render component and perform registration
          renderWithAuthProvider(
            registrationData.name,
            registrationData.email,
            registrationData.password,
            onRegisterSpy
          );

          // Wait for initial loading to complete
          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Perform registration action
          const registerButton = screen.getByTestId('register-btn');
          registerButton.click();

          // Assert: User should be registered and authenticated successfully
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
            expect(screen.getByTestId('user')).toHaveTextContent(user.name);
            expect(screen.getByTestId('email')).toHaveTextContent(user.email);
            expect(screen.getByTestId('error')).toHaveTextContent('No error');
          }, { timeout: 1000 });

          // Verify service calls
          expect(mockUserService.register).toHaveBeenCalledWith({
            name: registrationData.name,
            email: registrationData.email,
            password: registrationData.password,
          });
          expect(mockAuthService.login).toHaveBeenCalledWith(registrationData.email, registrationData.password);
          expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
          expect(onRegisterSpy).toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 5, timeout: 5000 }
    );
  }, 20000);

  it('Property 3: Registration Flow Success - registration errors should be handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        validRegistrationDataArbitrary,
        fc.oneof(
          fc.constant('Email already exists'),
          fc.constant('Invalid email format'),
          fc.constant('Password too weak'),
          fc.constant('Registration failed'),
          fc.constant('Server error')
        ),
        async (registrationData, errorMessage) => {
          // Mock registration failure
          mockUserService.register.mockRejectedValue(new Error(errorMessage));

          const onRegisterSpy = vi.fn();

          // Act: Render component and attempt registration
          renderWithAuthProvider(
            registrationData.name,
            registrationData.email,
            registrationData.password,
            onRegisterSpy
          );

          // Wait for initial loading to complete
          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          // Perform registration action
          const registerButton = screen.getByTestId('register-btn');
          registerButton.click();

          // Assert: Should show error and remain unauthenticated
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('user')).toHaveTextContent('No user');
            expect(screen.getByTestId('email')).toHaveTextContent('No email');
            expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
          }, { timeout: 1000 });

          // Verify registration was attempted but login was not called
          expect(mockUserService.register).toHaveBeenCalledWith({
            name: registrationData.name,
            email: registrationData.email,
            password: registrationData.password,
          });
          expect(mockAuthService.login).not.toHaveBeenCalled();
          expect(onRegisterSpy).not.toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3, timeout: 3000 }
    );
  }, 10000);

  it('Property 3: Registration Flow Success - network errors during registration should be handled', async () => {
    await fc.assert(
      fc.asyncProperty(
        validRegistrationDataArbitrary,
        fc.oneof(
          fc.constant('Network error'),
          fc.constant('Unable to reach the server'),
          fc.constant('Connection timeout'),
          fc.constant('Server unavailable')
        ),
        async (registrationData, networkError) => {
          // Mock network failure
          const error = new Error(networkError);
          mockUserService.register.mockRejectedValue(error);

          const onRegisterSpy = vi.fn();

          // Act: Render component and attempt registration
          renderWithAuthProvider(
            registrationData.name,
            registrationData.email,
            registrationData.password,
            onRegisterSpy
          );

          await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 500 });

          const registerButton = screen.getByTestId('register-btn');
          registerButton.click();

          // Assert: Should handle network error gracefully
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
            expect(screen.getByTestId('error')).toHaveTextContent(networkError);
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
          }, { timeout: 1000 });

          expect(onRegisterSpy).not.toHaveBeenCalled();

          // Cleanup
          cleanup();
        }
      ),
      { numRuns: 3, timeout: 3000 }
    );
  }, 10000);
});