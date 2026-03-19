import { ErrorInfo } from 'react';

export interface ErrorLogEntry {
  timestamp: Date;
  error: Error;
  errorInfo?: ErrorInfo;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalContext?: Record<string, any>;
}

export interface ErrorReportingService {
  captureException: (error: Error, context?: Record<string, any>) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
  setUser: (user: { id: string; email?: string; name?: string }) => void;
  setContext: (key: string, value: any) => void;
}

class ErrorLogger {
  private reportingService?: ErrorReportingService;
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    // Initialize error reporting service in production
    if (this.isProduction) {
      this.initializeReportingService();
    }
  }

  private initializeReportingService() {
    // In a real application, you would initialize services like:
    // - Sentry: Sentry.init({ dsn: 'your-dsn' })
    // - LogRocket: LogRocket.init('your-app-id')
    // - Bugsnag: Bugsnag.start({ apiKey: 'your-api-key' })
    
    // For now, we'll use a mock service that logs to console
    this.reportingService = {
      captureException: (error: Error, context?: Record<string, any>) => {
        console.error('Error captured:', error, context);
      },
      captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
        console.log(`[${level.toUpperCase()}] ${message}`);
      },
      setUser: (user: { id: string; email?: string; name?: string }) => {
        console.log('User context set:', user);
      },
      setContext: (key: string, value: any) => {
        console.log(`Context set: ${key}`, value);
      },
    };
  }

  logError(error: Error, errorInfo?: ErrorInfo, additionalContext?: Record<string, any>) {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date(),
      error,
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalContext,
    };

    // Log to console in development
    if (!this.isProduction) {
      console.group('🚨 Error Logged');
      console.error('Error:', error);
      console.log('Error Info:', errorInfo);
      console.log('Additional Context:', additionalContext);
      console.log('Full Log Entry:', logEntry);
      console.groupEnd();
    }

    // Send to reporting service
    if (this.reportingService) {
      this.reportingService.captureException(error, {
        errorInfo,
        ...additionalContext,
        timestamp: logEntry.timestamp.toISOString(),
        url: logEntry.url,
        userAgent: logEntry.userAgent,
      });
    }

    // Store in local storage for debugging (development only)
    if (!this.isProduction) {
      this.storeErrorLocally(logEntry);
    }
  }

  logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!this.isProduction) {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }

    if (this.reportingService) {
      this.reportingService.captureMessage(message, level);
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          this.reportingService!.setContext(key, value);
        });
      }
    }
  }

  setUser(user: { id: string; email?: string; name?: string }) {
    if (this.reportingService) {
      this.reportingService.setUser(user);
    }
  }

  setContext(key: string, value: any) {
    if (this.reportingService) {
      this.reportingService.setContext(key, value);
    }
  }

  private storeErrorLocally(logEntry: ErrorLogEntry) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      const updatedErrors = [logEntry, ...existingErrors].slice(0, 50); // Keep last 50 errors
      localStorage.setItem('error_logs', JSON.stringify(updatedErrors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }

  getLocalErrors(): ErrorLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (e) {
      console.warn('Failed to retrieve errors from localStorage:', e);
      return [];
    }
  }

  clearLocalErrors() {
    try {
      localStorage.removeItem('error_logs');
    } catch (e) {
      console.warn('Failed to clear errors from localStorage:', e);
    }
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions for common error types
export const logNetworkError = (error: Error, url: string, method: string) => {
  errorLogger.logError(error, undefined, {
    type: 'network_error',
    url,
    method,
  });
};

export const logAuthError = (error: Error, action: string) => {
  errorLogger.logError(error, undefined, {
    type: 'auth_error',
    action,
  });
};

export const logFileError = (error: Error, fileName: string, operation: string) => {
  errorLogger.logError(error, undefined, {
    type: 'file_error',
    fileName,
    operation,
  });
};

export const logValidationError = (error: Error, formName: string, field?: string) => {
  errorLogger.logError(error, undefined, {
    type: 'validation_error',
    formName,
    field,
  });
};

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      undefined,
      {
        type: 'unhandled_promise_rejection',
        reason: event.reason,
      }
    );
  });

  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    errorLogger.logError(
      event.error || new Error(event.message),
      undefined,
      {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}