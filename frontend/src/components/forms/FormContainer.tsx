import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormContainerProps } from '@/types/component.types';
import { cn } from '@/lib/utils';

export const FormContainer: React.FC<FormContainerProps> = ({
  onSubmit,
  children,
  loading = false,
  title,
  description,
  className,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)} padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {(title || description) && (
          <div className="text-center space-y-2">
            {title && (
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          {children}
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Submit'}
        </Button>
      </form>
    </Card>
  );
};