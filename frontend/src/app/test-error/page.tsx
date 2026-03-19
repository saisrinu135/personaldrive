'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useToast } from '@/components/base/Toast';

// Component that throws an error for testing
const ErrorThrower: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by the ErrorThrower component');
  }
  return (
    <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-md">
      <p className="text-green-800 dark:text-green-200">No error - component is working normally!</p>
    </div>
  );
};

export default function TestErrorPage() {
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const { handleError, handleNetworkError, handleAuthError, handleFileError } = useErrorHandling();
  const { addToast } = useToast();

  const triggerManualError = () => {
    handleError(new Error('This is a manually triggered error'), {
      toastTitle: 'Manual Error',
      toastMessage: 'This error was triggered manually for testing purposes',
    });
  };

  const triggerNetworkError = () => {
    handleNetworkError(
      new Error('Failed to fetch data from server'),
      '/api/test-endpoint',
      'GET'
    );
  };

  const triggerAuthError = () => {
    handleAuthError(
      new Error('Invalid credentials provided'),
      'login'
    );
  };

  const triggerFileError = () => {
    handleFileError(
      new Error('File size exceeds maximum limit'),
      'large-file.pdf',
      'upload'
    );
  };

  const showSuccessToast = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'This is a success message',
    });
  };

  const showWarningToast = () => {
    addToast({
      type: 'warning',
      title: 'Warning',
      message: 'This is a warning message',
    });
  };

  const showInfoToast = () => {
    addToast({
      type: 'info',
      title: 'Information',
      message: 'This is an informational message',
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Error Handling Test Page
          </h1>
          <p className="text-muted-foreground">
            This page demonstrates the error handling system including ErrorBoundary, Toast notifications, and error logging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ErrorBoundary Test */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ErrorBoundary Test</h2>
            <p className="text-muted-foreground mb-4">
              Test the ErrorBoundary component by throwing a JavaScript error.
            </p>
            
            <div className="space-y-4">
              <ErrorThrower shouldThrow={shouldThrowError} />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setShouldThrowError(true)}
                  variant="danger"
                  size="sm"
                >
                  Throw Error
                </Button>
                <Button
                  onClick={() => setShouldThrowError(false)}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Toast Notifications Test */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
            <p className="text-muted-foreground mb-4">
              Test different types of toast notifications.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={showSuccessToast} variant="primary" size="sm">
                Success Toast
              </Button>
              <Button onClick={triggerManualError} variant="danger" size="sm">
                Error Toast
              </Button>
              <Button onClick={showWarningToast} variant="outline" size="sm">
                Warning Toast
              </Button>
              <Button onClick={showInfoToast} variant="ghost" size="sm">
                Info Toast
              </Button>
            </div>
          </Card>

          {/* Specific Error Types */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Specific Error Types</h2>
            <p className="text-muted-foreground mb-4">
              Test different categories of errors with specific logging.
            </p>
            
            <div className="space-y-2">
              <Button onClick={triggerNetworkError} variant="outline" size="sm" className="w-full">
                Network Error
              </Button>
              <Button onClick={triggerAuthError} variant="outline" size="sm" className="w-full">
                Authentication Error
              </Button>
              <Button onClick={triggerFileError} variant="outline" size="sm" className="w-full">
                File Error
              </Button>
            </div>
          </Card>

          {/* Error Pages Links */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Error Pages</h2>
            <p className="text-muted-foreground mb-4">
              Test the custom error pages.
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/non-existent-page'} 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                Test 404 Page
              </Button>
              <Button 
                onClick={() => {
                  // Force a navigation error
                  window.history.pushState(null, '', '/test-error-page');
                }} 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                Test Navigation
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Development Tools</h2>
          <p className="text-muted-foreground mb-4">
            In development mode, errors are logged to the console and stored in localStorage.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
                console.log('Stored errors:', errors);
                alert(`Found ${errors.length} stored errors. Check console for details.`);
              }}
              variant="ghost" 
              size="sm"
            >
              View Stored Errors
            </Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('error_logs');
                alert('Error logs cleared from localStorage');
              }}
              variant="ghost" 
              size="sm"
            >
              Clear Error Logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}