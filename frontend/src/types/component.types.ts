import { ReactNode } from 'react';
import { User } from './auth.types';

// Base Component Props
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: ReactNode;
  helperText?: string;
  className?: string;
}

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

// Form Component Props
export interface FormInputProps extends InputProps {
  name: string;
  validation?: ValidationRule[];
  showValidation?: boolean;
}

export interface PasswordToggleProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  showStrengthIndicator?: boolean;
  className?: string;
}

export interface FormContainerProps {
  onSubmit: (data: any) => void;
  children: ReactNode;
  loading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

// Validation System
export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface EmailInputProps extends FormInputProps {
  validateDomain?: boolean;
  allowedDomains?: string[];
}

export interface NameInputProps extends FormInputProps {
  minLength?: number;
  maxLength?: number;
  allowSpecialChars?: boolean;
}

// Navigation Components
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface NavigationMenuProps {
  items: NavigationItem[];
  currentPath: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

// Layout Components
export interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  sidebar?: ReactNode;
}

export interface HeaderProps {
  user?: User;
  onLogout: () => void;
  navigationItems: NavigationItem[];
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}