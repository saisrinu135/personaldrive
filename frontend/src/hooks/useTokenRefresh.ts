'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken, getRefreshToken } from '@/services/storage.service';

// JWT token payload interface
interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
}

// Decode JWT token (simple base64 decode, no verification)
const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

// Check if token is expired or will expire soon (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expirationBuffer = 5 * 60; // 5 minutes in seconds
  
  return payload.exp <= (now + expirationBuffer);
};

// Custom hook for automatic token refresh
export const useTokenRefresh = () => {
  const { isAuthenticated, refreshAuth, logout } = useAuth();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear any existing refresh timeout when not authenticated
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    const scheduleTokenRefresh = () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (!token || !refreshToken) {
        logout();
        return;
      }

      const payload = decodeJWT(token);
      if (!payload) {
        logout();
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      const refreshBuffer = 5 * 60; // 5 minutes in seconds
      
      // Schedule refresh 5 minutes before expiry, or immediately if already expired
      const refreshIn = Math.max(0, (timeUntilExpiry - refreshBuffer) * 1000);
      
      refreshTimeoutRef.current = setTimeout(async () => {
        if (isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        try {
          await refreshAuth();
          // Schedule the next refresh after successful refresh
          scheduleTokenRefresh();
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
        } finally {
          isRefreshingRef.current = false;
        }
      }, refreshIn);
    };

    // Initial schedule
    scheduleTokenRefresh();

    // Cleanup timeout on unmount or when authentication changes
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, refreshAuth, logout]);

  // Manual refresh function that can be called by components
  const manualRefresh = async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;
    
    const token = getAccessToken();
    if (!token || !isTokenExpiringSoon(token)) return false;
    
    isRefreshingRef.current = true;
    try {
      await refreshAuth();
      return true;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      logout();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  return {
    manualRefresh,
    isRefreshing: isRefreshingRef.current,
  };
};