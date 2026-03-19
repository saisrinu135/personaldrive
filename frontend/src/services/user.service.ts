import axiosInstance from '@/lib/axios';
import { RegisterRequest, RegisterResponse, UpdateProfileRequest, ChangePasswordRequest } from '@/types/user.types';
import { User } from '@/types/auth.types';

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100;
};

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  // Client-side validation
  if (!validateEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  
  if (!validatePassword(data.password)) {
    throw new Error('Password must be at least 6 characters');
  }
  
  if (!validateName(data.name)) {
    throw new Error('Name must be between 2 and 100 characters');
  }
  
  const response = await axiosInstance.post<RegisterResponse>('/api/v1/users/register', data);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/api/v1/users/profile');
  return response.data;
};

export const updateUserProfile = async (data: UpdateProfileRequest): Promise<User> => {
  // Only send fields that are provided (partial update)
  const updateData: Partial<UpdateProfileRequest> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  
  const response = await axiosInstance.put<User>('/api/v1/users/profile', updateData);
  return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  if (!data.current_password || !data.new_password) {
    throw new Error('Both current password and new password are required');
  }
  
  if (!validatePassword(data.new_password)) {
    throw new Error('New password must be at least 6 characters');
  }
  
  await axiosInstance.put('/api/v1/users/change-password', data);
};
