'use client';

import { Card } from '@/components/ui/Card';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Loading...
          </h1>
          <p className="text-muted-foreground">
            Please wait while we prepare your content.
          </p>
        </div>
      </Card>
    </div>
  );
}