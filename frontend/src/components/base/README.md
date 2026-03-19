# Error Handling System

This directory contains the comprehensive error handling system for the frontend application, implementing task 7.4 requirements.

## Components

### ErrorBoundary
A React Error Boundary component that catches JavaScript errors anywhere in the child component tree.

**Features:**
- Catches and displays JavaScript errors with user-friendly UI
- Provides "Try Again" and "Reload Page" recovery options
- Logs errors using the error logging system
- Shows detailed error information in development mode
- Supports custom fallback UI and error callbacks

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/base/ErrorBoundary';

<ErrorBoundary onError={(error, errorInfo) => console.log('Error caught:', error)}>
  <YourComponent />
</ErrorBoundary>
```

### Toast Notification System
A comprehensive toast notification system for displaying user-friendly messages.

**Features:**
- Support for success, error, warning, and info toast types
- Auto-dismiss with configurable duration
- Manual dismiss with close button
- Action buttons for interactive toasts
- Smooth animations with framer-motion
- Context-based API for easy usage throughout the app

**Usage:**
```tsx
import { useToast, useErrorToast } from '@/components/base/Toast';

const { addToast } = useToast();
const showError = useErrorToast();

// Generic toast
addToast({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully',
  action: { label: 'View', onClick: () => navigate('/view') }
});

// Quick error toast
showError('Error occurred', 'Please try again');
```

## Error Pages

### 404 Not Found Page (`/app/not-found.tsx`)
Custom 404 page with:
- User-friendly error message
- Navigation options (Go Home, Go Back)
- Contact support link
- Consistent styling with the application theme

### Global Error Page (`/app/error.tsx`)
Next.js global error page for handling application-wide errors:
- Error logging and reporting
- Multiple recovery options
- Development mode error details
- Production-ready error handling

### Loading Page (`/app/loading.tsx`)
Loading state page for better user experience during page transitions.

## Utilities

### Error Logger (`/utils/error-logger.ts`)
Comprehensive error logging system with:
- Console logging in development
- Error reporting service integration (ready for Sentry, LogRocket, etc.)
- Local storage for development debugging
- Categorized error logging (network, auth, file, validation)
- User context and additional metadata support

**Features:**
- Automatic error categorization
- Development vs production behavior
- Local error storage for debugging
- Global error handlers for unhandled errors
- Integration with monitoring services

### Error Handling Hook (`/hooks/useErrorHandling.ts`)
React hook that integrates error logging with toast notifications:

**Features:**
- Unified error handling interface
- Automatic toast notifications
- Categorized error handlers (network, auth, file, validation)
- Async error handling wrapper
- Configurable options for each error type

**Usage:**
```tsx
import { useErrorHandling } from '@/hooks/useErrorHandling';

const { handleError, handleNetworkError, handleAsyncError } = useErrorHandling();

// Generic error
handleError(new Error('Something went wrong'), {
  toastTitle: 'Custom Title',
  showToast: true,
  context: { userId: '123' }
});

// Network error with specific handling
handleNetworkError(error, '/api/users', 'GET');

// Async operation with error handling
const result = await handleAsyncError(async () => {
  return await fetchUserData();
});
```

## Integration

The error handling system is integrated into the application at multiple levels:

1. **Root Level**: ErrorBoundary and ToastProvider wrap the entire application in `layout.tsx`
2. **Global Handlers**: Automatic handling of unhandled promise rejections and uncaught errors
3. **Component Level**: Individual components can use error handling hooks
4. **Service Level**: API services can use categorized error logging

## Testing

The system includes comprehensive tests for:
- ErrorBoundary component behavior
- Toast notification functionality
- Error handling hook integration
- Error logging utilities

## Development Tools

For development and debugging:
- Error details shown in development mode
- Local storage of error logs
- Console logging with detailed context
- Test page at `/test-error` for manual testing

## Production Considerations

- Error details hidden in production
- Ready for integration with error monitoring services
- Graceful degradation and recovery options
- User-friendly error messages
- Automatic error reporting and logging

## Error Recovery Mechanisms

1. **Automatic Retry**: Network requests with exponential backoff (ready for implementation)
2. **Graceful Degradation**: Fallback functionality when features are unavailable
3. **User-Initiated Retry**: Manual retry buttons for failed operations
4. **Session Recovery**: Automatic token refresh and re-authentication (integrated with auth system)

This error handling system provides comprehensive coverage for all error scenarios while maintaining a great user experience and providing developers with the tools needed for debugging and monitoring.