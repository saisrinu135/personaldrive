export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}
