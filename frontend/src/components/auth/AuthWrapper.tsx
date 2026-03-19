'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

// Component that handles automatic token refresh
const TokenRefreshHandler: React.FC<{ children: ReactNode }> = ({ children }) => {
  useTokenRefresh();
  return <>{children}</>;
};

// Main auth wrapper that provides authentication context and automatic token refresh
interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <AuthProvider>
      <TokenRefreshHandler>
        {children}
      </TokenRefreshHandler>
    </AuthProvider>
  );
};

export default AuthWrapper;