# Authentication Context

This directory contains the authentication context and related components for managing user authentication state throughout the application.

## Overview

The authentication system provides:
- User state management with React Context
- JWT token persistence in browser storage
- Automatic token refresh functionality
- Comprehensive error handling
- TypeScript support with full type safety

## Components

### AuthContext
The main authentication context that manages user state, tokens, and authentication operations.

**Features:**
- Persists authentication state in localStorage
- Automatically restores authentication on app reload
- Handles token refresh when tokens expire
- Provides login, register, logout, and error management functions

### AuthWrapper
A wrapper component that provides the AuthContext and automatic token refresh functionality to the entire application.

### useTokenRefresh Hook
A custom hook that handles automatic JWT token refresh based on token expiration times.

**Features:**
- Schedules token refresh 5 minutes before expiration
- Handles concurrent requests during token refresh
- Provides manual refresh functionality
- Automatically logs out users when refresh fails

## Usage

### 1. Wrap your application with AuthWrapper

```tsx
// In your root layout or App component
import { AuthWrapper } from '@/components/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
```

### 2. Use the useAuth hook in components

```tsx
import { useAuth } from '@/contexts/AuthContext';

export const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    register, 
    logout, 
    clearError 
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={clearError}>Clear Error</button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <p>Welcome, {user.name}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => login('email@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => register('Name', 'email@example.com', 'password')}>
        Register
      </button>
    </div>
  );
};
```

### 3. Protected Routes

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <div>Protected content</div>;
};
```

## API Reference

### AuthState Interface
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### AuthContextType Interface
```typescript
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}
```

### User Interface
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

The authentication context handles various error scenarios:

- **Network errors**: Connection issues with the backend
- **Authentication errors**: Invalid credentials, expired tokens
- **Validation errors**: Invalid email format, weak passwords
- **Server errors**: Backend service unavailable

All errors are captured in the `error` state and can be cleared using the `clearError` function.

## Token Management

### Automatic Refresh
- Tokens are automatically refreshed 5 minutes before expiration
- Concurrent requests are queued during refresh operations
- Failed refresh attempts result in automatic logout

### Storage
- Access tokens are stored in localStorage
- Refresh tokens are stored in localStorage
- All tokens are cleared on logout or failed refresh

### Security
- Tokens are validated on app initialization
- Expired tokens trigger automatic refresh attempts
- Invalid or expired refresh tokens result in logout

## Testing

The authentication context includes comprehensive tests:

### Unit Tests
- Authentication state management
- Login/register/logout flows
- Error handling scenarios
- Token refresh functionality

### Property-Based Tests
- Authentication persistence across app reloads
- Token refresh with various token states
- Error handling with different failure scenarios

Run tests with:
```bash
npm test AuthContext.test.tsx --run
npm test AuthContext.property.test.tsx --run
```

## Requirements Validation

This implementation validates the following requirements:

- **10.1**: Authentication state persistence in browser storage
- **10.2**: Automatic authentication restoration on app reload
- **10.3**: Automatic token refresh functionality
- **10.7**: Authentication status available to all components

The property-based tests specifically validate **Property 34: Authentication Persistence** ensuring that authentication state is correctly persisted and restored across all scenarios.