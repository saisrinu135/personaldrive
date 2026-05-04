'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="default" size="md" className="w-full">
              Go Home
            </Button>
          </Link>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="md"
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}