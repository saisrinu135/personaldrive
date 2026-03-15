import axiosInstance from '@/lib/axios';
import { setAccessToken, setRefreshToken, clearTokens } from './storage.service';
import { LoginResponse, RefreshResponse, User } from '@/types/auth.types';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/api/v1/auth/login', {
    email,
    password,
  });
  
  const { access_token, refresh_token } = response.data;
  setAccessToken(access_token);
  setRefreshToken(refresh_token);
  
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('/api/v1/auth/logout');
  } finally {
    clearTokens();
  }
};

export const refreshToken = async (refreshToken: string): Promise<string> => {
  const response = await axiosInstance.post<RefreshResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });
  
  const { access_token } = response.data;
  setAccessToken(access_token);
  
  return access_token;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/api/v1/auth/me');
  return response.data;
};
