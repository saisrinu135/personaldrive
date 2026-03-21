'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, AuthContextType, AuthAction } from '@/types/auth-state.types';
import { User } from '@/types/auth.types';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '@/services/storage.service';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_REFRESH_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize authentication state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();

      if (token && refreshToken) {
        try {
          // Verify token by fetching current user
          const user = await authService.getCurrentUser();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token, refreshToken },
          });
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            const newToken = await authService.refreshToken(refreshToken);
            const user = await authService.getCurrentUser();
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token: newToken, refreshToken },
            });
          } catch (refreshError) {
            // Refresh failed, clear tokens and set unauthenticated
            clearTokens();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        }
      } else {
        // No tokens found, set as unauthenticated
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const loginResponse = await authService.login(email, password);
      // The login response already contains the user object - no need for a separate /me call
      const user = loginResponse.user ?? await authService.getCurrentUser();
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user,
          token: loginResponse.access_token,
          refreshToken: loginResponse.refresh_token,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // Register the user
      await userService.register({ name, email, password });
      
      // Automatically log in after successful registration
      await login(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    authService.logout().finally(() => {
      dispatch({ type: 'AUTH_LOGOUT' });
      router.push('/login');
    });
  };

  // Refresh authentication
  const refreshAuth = async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }

    try {
      const newToken = await authService.refreshToken(refreshToken);
      dispatch({
        type: 'AUTH_REFRESH_SUCCESS',
        payload: { token: newToken },
      });
    } catch (error) {
      clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;