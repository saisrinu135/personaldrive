import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens, isTokenExpired } from '@/services/storage.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cloud.saisrinu.online';

// Formatted error interface for consistent error handling
export interface FormattedError {
  message: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  originalError: AxiosError;
}

// Format error responses consistently
const formatError = (error: AxiosError): FormattedError => {
  const formattedError: FormattedError = {
    message: 'An unexpected error occurred',
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    originalError: error,
  };

  // Extract error message from various response formats
  if (error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    
    // Handle FastAPI validation errors (array format)
    if (Array.isArray(data.detail)) {
      const validationErrors = data.detail.map((err: { loc: string[]; msg: string }) => 
        `${err.loc.join('.')}: ${err.msg}`
      ).join(', ');
      formattedError.message = `Validation error: ${validationErrors}`;
    }
    // Handle standard error detail (string format)
    else if (typeof data.detail === 'string') {
      formattedError.message = data.detail;
    }
    // Handle generic message field
    else if (typeof data.message === 'string') {
      formattedError.message = data.message;
    }
  }
  // Handle network errors
  else if (error.request && !error.response) {
    formattedError.message = 'Network error: Unable to reach the server';
  }
  // Handle request setup errors
  else if (!error.request) {
    formattedError.message = error.message || 'Request configuration error';
  }

  return formattedError;
};

// Create axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject access token, proactively refresh if near expiry
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip proactive refresh for auth endpoints to avoid loops
    const isAuthEndpoint = config.url?.includes('/auth/login') ||
                           config.url?.includes('/auth/refresh') ||
                           config.url?.includes('/auth/logout') ||
                           config.url?.includes('/users/register');

    if (!isAuthEndpoint) {
      const accessToken = getAccessToken();

      // Proactively refresh if token is expired or expiring within 30s
      if (isTokenExpired(accessToken)) {
        const refreshToken = getRefreshToken();
        if (refreshToken && !isTokenExpired(refreshToken, 0)) {
          try {
            const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const responseData = response.data?.data ?? response.data;
            const { access_token } = responseData;
            setAccessToken(access_token);
            if (config.headers) {
              config.headers.Authorization = `Bearer ${access_token}`;
            }
          } catch {
            // Refresh failed - clear tokens and redirect to login
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(new Error('Session expired'));
          }
        } else {
          // No valid refresh token either - redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Session expired'));
        }
      } else if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ 
  resolve: (value?: unknown) => void; 
  reject: (reason?: unknown) => void;
  originalRequest: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry the original request with the new token
      if (token && prom.originalRequest.headers) {
        prom.originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(axiosInstance(prom.originalRequest));
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Do not attempt to refresh if the request was a login attempt or register attempt
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/users/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        })
          .catch((err) => Promise.reject(formatError(err as AxiosError)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        // Only redirect if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(formatError(error));
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        // Backend wraps responses in { status, message, data: {...} }
        const responseData = response.data?.data ?? response.data;
        const { access_token } = responseData;
        setAccessToken(access_token);
        
        // Update the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        
        processQueue(null, access_token);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        // Only redirect if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(formatError(refreshError as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }

    // Format all errors consistently before rejecting
    return Promise.reject(formatError(error));
  }
);

export default axiosInstance;
