'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { errorLogger } from '@/utils/error-logger';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error using error logger
    errorLogger.logError(error, undefined, {
      component: 'GlobalErrorPage',
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            variant="default"
            size="md"
            className="w-full"
          >
            Try Again
          </Button>
          <Button
            onClick={handleReload}
            variant="outline"
            size="md"
            className="w-full"
          >
            Reload Page
          </Button>
          <Button
            onClick={handleGoHome}
            variant="ghost"
            size="md"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Error Details (Development)
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono text-muted-foreground overflow-auto">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.digest && (
                <div className="mb-2">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
              <div>
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">
                  {error.stack}
                </pre>
              </div>
            </div>
          </details>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact our support team.
          </p>
        </div>
      </Card>
    </div>
  );
}