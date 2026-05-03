// Application constants
export const APP_NAME = 'CloudVault';
export const APP_DESCRIPTION = 'Your personal cloud storage solution';

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
export const ALLOWED_FILE_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/*',
  'application/zip',
  'application/x-rar-compressed',
];

// Storage limits
export const DEFAULT_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB

// Navigation items
export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'lucide-layout-dashboard',
  },
  {
    label: 'Files',
    href: '/files',
    icon: 'lucide-folder',
  },
  {
    label: 'Providers',
    href: '/providers',
    icon: 'lucide-cloud',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: 'lucide-user',
  },
];

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
  },
  FILES: {
    UPLOAD: '/files/upload',
    LIST: '/files',
    DOWNLOAD: '/files/download',
    DELETE: '/files',
  },
  PROVIDERS: {
    LIST: '/providers',
    CREATE: '/providers',
    UPDATE: '/providers',
    DELETE: '/providers',
    TEST: '/providers/test',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NAME_MIN_LENGTH: 'Name must be at least 2 characters long',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  FILE_TYPE_NOT_ALLOWED: 'File type is not allowed',
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Provider types
export const PROVIDER_TYPES = {
  AWS: 'aws',
  ORACLE: 'oracle',
  CLOUDFLARE: 'cloudflare',
  OTHERS: 'others',
} as const;