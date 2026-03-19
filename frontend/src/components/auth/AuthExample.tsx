'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Example component showing how to use the AuthContext
export const AuthExample: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600">Loading authentication...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-800 mb-2">Authentication Error:</div>
        <div className="text-red-600 mb-3">{error}</div>
        <button
          onClick={clearError}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Error
        </button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <div className="text-green-800 mb-2">Welcome back!</div>
        <div className="text-green-700 mb-3">
          Logged in as: <strong>{user.name}</strong> ({user.email})
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="text-blue-800 mb-2">Not authenticated</div>
      <div className="text-blue-600 mb-3">Please log in to continue</div>
      <button
        onClick={() => login('demo@example.com', 'password')}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
      >
        Demo Login
      </button>
    </div>
  );
};

export default AuthExample;