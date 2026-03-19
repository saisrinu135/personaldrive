import axiosInstance from '@/lib/axios';
import { setAccessToken, setRefreshToken, clearTokens, getAccessToken, getRefreshToken } from './storage.service';
import { LoginResponse, RefreshResponse, User } from '@/types/auth.types';
import { RegisterRequest, RegisterResponse } from '@/types/user.types';
import { FormattedError } from '@/lib/axios';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>('/api/v1/auth/login', {
      email,
      password,
    });
    
    const { access_token, refresh_token } = response.data;
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    
    return response.data;
  } catch (error) {
    // Clear any existing tokens on login failure
    clearTokens();
    throw error;
  }
};

export const register = async (name: string, email: string, password: string): Promise<RegisterResponse> => {
  try {
    const response = await axiosInstance.post<RegisterResponse>('/api/v1/users/register', {
      name,
      email,
      password,
    });
    
    return response.data;
  } catch (error) {
    // Ensure no tokens are set on registration failure
    clearTokens();
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('/api/v1/auth/logout');
  } catch (error) {
    // Log the error but don't throw - we still want to clear tokens locally
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear tokens regardless of API call success/failure
    clearTokens();
  }
};

export const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const response = await axiosInstance.post<RefreshResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    const { access_token } = response.data;
    setAccessToken(access_token);
    
    return access_token;
  } catch (error) {
    // Clear tokens if refresh fails
    clearTokens();
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await axiosInstance.get<User>('/api/v1/auth/me');
    return response.data;
  } catch (error) {
    // If getting current user fails with 401, it means token is invalid
    if ((error as FormattedError).status === 401) {
      clearTokens();
    }
    throw error;
  }
};

// Authentication state utilities
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(token && refreshToken);
};

export const hasValidTokens = (): boolean => {
  return isAuthenticated();
};

// Error handling utilities
export const isAuthenticationError = (error: unknown): boolean => {
  return (error as FormattedError).status === 401;
};

export const isNetworkError = (error: unknown): boolean => {
  const formattedError = error as FormattedError;
  return formattedError.message?.includes('Network error') || 
         formattedError.message?.includes('Unable to reach the server') ||
         !formattedError.status;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  const formattedError = error as FormattedError;
  return formattedError.message || 'An unexpected error occurred';
};