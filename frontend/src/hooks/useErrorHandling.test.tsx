import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useErrorHandling } from './useErrorHandling';
import { ToastProvider } from '@/components/base/Toast';

// Mock the error logger
vi.mock('@/utils/error-logger', () => ({
  errorLogger: {
    logError: vi.fn(),
  },
  logNetworkError: vi.fn(),
  logAuthError: vi.fn(),
  logFileError: vi.fn(),
  logValidationError: vi.fn(),
}));

// Test component that uses the error handling hook
const ErrorHandlingTestComponent: React.FC = () => {
  const {
    handleError,
    handleNetworkError,
    handleAuthError,
    handleFileError,
    handleValidationError,
    handleAsyncError,
  } = useErrorHandling();

  const testAsyncFunction = async (shouldFail: boolean) => {
    if (shouldFail) {
      throw new Error('Async operation failed');
    }
    return 'Success';
  };

  return (
    <div>
      <button onClick={() => handleError(new Error('Generic error'))}>
        Handle Generic Error
      </button>
      <button onClick={() => handleError(new Error('Custom error'), { 
        toastTitle: 'Custom Title',
        toastMessage: 'Custom message',
        showToast: true 
      })}>
        Handle Custom Error
      </button>
      <button onClick={() => handleError(new Error('Silent error'), { showToast: false })}>
        Handle Silent Error
      </button>
      <button onClick={() => handleNetworkError(new Error('Network failed'), '/api/test', 'GET')}>
        Handle Network Error
      </button>
      <button onClick={() => handleAuthError(new Error('Auth failed'), 'login')}>
        Handle Auth Error
      </button>
      <button onClick={() => handleFileError(new Error('File failed'), 'test.txt', 'upload')}>
        Handle File Error
      </button>
      <button onClick={() => handleValidationError(new Error('Validation failed'), 'loginForm', 'email')}>
        Handle Validation Error
      </button>
      <button onClick={async () => {
        const result = await handleAsyncError(() => testAsyncFunction(true));
        console.log('Async result:', result);
      }}>
        Handle Async Error
      </button>
      <button onClick={async () => {
        const result = await handleAsyncError(() => testAsyncFunction(false));
        console.log('Async result:', result);
      }}>
        Handle Async Success
      </button>
    </div>
  );
};

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle generic error with default options', async () => {
    const { errorLogger } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Generic Error'));

    // Should show error toast
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Generic error')).toBeInTheDocument();
    });

    // Should log error
    expect(errorLogger.logError).toHaveBeenCalledWith(
      expect.any(Error),
      undefined,
      expect.objectContaining({
        handledBy: 'useErrorHandling',
        timestamp: expect.any(String),
      })
    );
  });

  it('should handle error with custom options', async () => {
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Custom Error'));

    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  it('should handle silent error without showing toast', async () => {
    const { errorLogger } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Silent Error'));

    // Should not show toast
    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
      expect(screen.queryByText('Silent error')).not.toBeInTheDocument();
    });

    // Should still log error
    expect(errorLogger.logError).toHaveBeenCalled();
  });

  it('should handle network error with specific logging', async () => {
    const { logNetworkError } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Network Error'));

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to the server. Please check your internet connection.')).toBeInTheDocument();
    });

    expect(logNetworkError).toHaveBeenCalledWith(
      expect.any(Error),
      '/api/test',
      'GET'
    );
  });

  it('should handle auth error with specific logging', async () => {
    const { logAuthError } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Auth Error'));

    await waitFor(() => {
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Please check your credentials and try again.')).toBeInTheDocument();
    });

    expect(logAuthError).toHaveBeenCalledWith(
      expect.any(Error),
      'login'
    );
  });

  it('should handle file error with specific logging', async () => {
    const { logFileError } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle File Error'));

    await waitFor(() => {
      expect(screen.getByText('File Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to upload file: test.txt')).toBeInTheDocument();
    });

    expect(logFileError).toHaveBeenCalledWith(
      expect.any(Error),
      'test.txt',
      'upload'
    );
  });

  it('should handle validation error with specific logging', async () => {
    const { logValidationError } = require('@/utils/error-logger');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Validation Error'));

    await waitFor(() => {
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('Please check your input and try again.')).toBeInTheDocument();
    });

    expect(logValidationError).toHaveBeenCalledWith(
      expect.any(Error),
      'loginForm',
      'email'
    );
  });

  it('should handle async error and return null', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Async Error'));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Async operation failed')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Async result:', null);
    });
  });

  it('should handle async success and return result', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <ToastProvider>
        <ErrorHandlingTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Handle Async Success'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Async result:', 'Success');
    });

    // Should not show error toast
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});