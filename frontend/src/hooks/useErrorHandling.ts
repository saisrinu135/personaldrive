import { useCallback } from 'react';
import { useErrorToast } from '@/components/base/Toast';
import { errorLogger, logNetworkError, logAuthError, logFileError, logValidationError } from '@/utils/error-logger';

export interface ErrorHandlingOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastMessage?: string;
  logError?: boolean;
  context?: Record<string, any>;
}

export const useErrorHandling = () => {
  const showErrorToast = useErrorToast();

  const handleError = useCallback((
    error: Error,
    options: ErrorHandlingOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      toastMessage,
      logError = true,
      context = {}
    } = options;

    // Log the error
    if (logError) {
      errorLogger.logError(error, undefined, {
        ...context,
        handledBy: 'useErrorHandling',
        timestamp: new Date().toISOString(),
      });
    }

    // Show toast notification
    if (showToast) {
      showErrorToast(
        toastTitle,
        toastMessage || error.message || 'An unexpected error occurred'
      );
    }
  }, [showErrorToast]);

  const handleNetworkError = useCallback((
    error: Error,
    url: string,
    method: string,
    options: Omit<ErrorHandlingOptions, 'context'> = {}
  ) => {
    logNetworkError(error, url, method);
    
    handleError(error, {
      ...options,
      toastTitle: options.toastTitle || 'Network Error',
      toastMessage: options.toastMessage || 'Failed to connect to the server. Please check your internet connection.',
      logError: false, // Already logged by logNetworkError
    });
  }, [handleError]);

  const handleAuthError = useCallback((
    error: Error,
    action: string,
    options: Omit<ErrorHandlingOptions, 'context'> = {}
  ) => {
    logAuthError(error, action);
    
    handleError(error, {
      ...options,
      toastTitle: options.toastTitle || 'Authentication Error',
      toastMessage: options.toastMessage || 'Please check your credentials and try again.',
      logError: false, // Already logged by logAuthError
    });
  }, [handleError]);

  const handleFileError = useCallback((
    error: Error,
    fileName: string,
    operation: string,
    options: Omit<ErrorHandlingOptions, 'context'> = {}
  ) => {
    logFileError(error, fileName, operation);
    
    handleError(error, {
      ...options,
      toastTitle: options.toastTitle || 'File Error',
      toastMessage: options.toastMessage || `Failed to ${operation} file: ${fileName}`,
      logError: false, // Already logged by logFileError
    });
  }, [handleError]);

  const handleValidationError = useCallback((
    error: Error,
    formName: string,
    field?: string,
    options: Omit<ErrorHandlingOptions, 'context'> = {}
  ) => {
    logValidationError(error, formName, field);
    
    handleError(error, {
      ...options,
      toastTitle: options.toastTitle || 'Validation Error',
      toastMessage: options.toastMessage || 'Please check your input and try again.',
      logError: false, // Already logged by logValidationError
    });
  }, [handleError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleNetworkError,
    handleAuthError,
    handleFileError,
    handleValidationError,
    handleAsyncError,
  };
};