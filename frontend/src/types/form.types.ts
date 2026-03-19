// Form State Management Types
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Authentication Form Data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Profile Form Data
export interface ProfileFormData {
  name: string;
  email: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Navigation State
export interface NavigationState {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
}

// Dashboard Data Models
export interface DashboardStats {
  totalFiles: number;
  storageUsed: number;
  storageLimit: number;
  recentFiles: FileMetadata[];
  uploadActivity: {
    date: Date;
    count: number;
  }[];
}

// Import types from other files
import { BreadcrumbItem } from './component.types';
import { FileMetadata } from './file.types';