import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import * as storageService from '@/services/storage.service';

// Mock the services
vi.mock('@/services/auth.service');
vi.mock('@/services/user.service');
vi.mock('@/services/storage.service');

const mockAuthService = vi.mocked(authService);
const mockUserService = vi.mocked(userService);
const mockStorageService = vi.mocked(storageService);

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('Test User', 'test@example.com', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
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

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorageService.getAccessToken.mockReturnValue(null);
    mockStorageService.getRefreshToken.mockReturnValue(null);
  });

  it('should initialize with unauthenticated state when no tokens exist', async () => {
    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  it('should restore authentication state from valid tokens', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    mockStorageService.getAccessToken.mockReturnValue('valid-token');
    mockStorageService.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    const mockLoginResponse = {
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
    };

    mockAuthService.login.mockResolvedValue(mockLoginResponse);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithAuthProvider();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Perform login
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));

    renderWithAuthProvider();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Perform login and wait for error handling
    await act(async () => {
      screen.getByText('Login').click();
      // Wait a bit for the promise to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  it('should handle registration successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    const mockRegisterResponse = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
    };

    const mockLoginResponse = {
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
    };

    mockUserService.register.mockResolvedValue(mockRegisterResponse);
    mockAuthService.login.mockResolvedValue(mockLoginResponse);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    renderWithAuthProvider();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Perform registration
    act(() => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(mockUserService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    // Start with authenticated state
    mockStorageService.getAccessToken.mockReturnValue('valid-token');
    mockStorageService.getRefreshToken.mockReturnValue('valid-refresh-token');
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue();

    renderWithAuthProvider();

    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Perform logout
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  it('should clear error state', async () => {
    const errorMessage = 'Test error';
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));

    renderWithAuthProvider();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Trigger error and wait for error handling
    await act(async () => {
      screen.getByText('Login').click();
      // Wait a bit for the promise to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });

    // Clear error
    act(() => {
      screen.getByText('Clear Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('should attempt token refresh when token is expired', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    mockStorageService.getAccessToken.mockReturnValue('expired-token');
    mockStorageService.getRefreshToken.mockReturnValue('valid-refresh-token');
    
    // First call fails (expired token), second call succeeds after refresh
    mockAuthService.getCurrentUser
      .mockRejectedValueOnce(new Error('Token expired'))
      .mockResolvedValueOnce(mockUser);
    
    mockAuthService.refreshToken.mockResolvedValue('new-token');

    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

  it('should logout when token refresh fails', async () => {
    mockStorageService.getAccessToken.mockReturnValue('expired-token');
    mockStorageService.getRefreshToken.mockReturnValue('invalid-refresh-token');
    
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Token expired'));
    mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

    renderWithAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(mockStorageService.clearTokens).toHaveBeenCalled();
    });
  });
});