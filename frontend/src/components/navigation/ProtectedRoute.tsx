'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for stored tokens
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!accessToken && !refreshToken) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
          return;
        }

        // Validate token (simplified - in real app, verify with backend)
        if (accessToken) {
          try {
            // Parse JWT payload to check expiration
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();

            if (!isExpired) {
              // Token is valid
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: payload.user || { id: payload.sub },
              });
              return;
            }
          } catch (error) {
            console.warn('Invalid token format:', error);
          }
        }

        // Try to refresh token if available
        if (refreshToken) {
          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('access_token', data.access_token);
              
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: data.user || { id: 'user' },
              });
              return;
            }
          } catch (error) {
            console.warn('Token refresh failed:', error);
          }
        }

        // Authentication failed
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    };

    checkAuth();
  }, []);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!authState.isLoading && requireAuth && !authState.isAuthenticated) {
      // Store the attempted URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
    }
  }, [authState.isLoading, authState.isAuthenticated, requireAuth, router, redirectTo, pathname]);

  // Loading state
  if (authState.isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-96">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Loader2 className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Checking Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your credentials...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    );
  }

  // Unauthenticated state (will redirect, but show loading briefly)
  if (requireAuth && !authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-96">
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Authentication Required</h3>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page...
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default ProtectedRoute;