import React, { forwardRef } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { EmailInputProps } from '@/types/component.types';
import { FormInput } from './FormInput';
import { ValidationRule } from '@/types/component.types';
import { useAsyncValidation } from '@/hooks/useValidation';
import { cn } from '@/lib/utils';

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({
    validateDomain = false,
    allowedDomains = [],
    className,
    ...props
  }, ref) => {
    // Create validation rules
    const validationRules: ValidationRule[] = [
      {
        type: 'required',
        message: 'Email is required',
      },
      {
        type: 'email',
        message: 'Please enter a valid email address',
      },
      ...(props.validation || []),
    ];

    // Add domain validation if specified
    if (validateDomain && allowedDomains.length > 0) {
      validationRules.push({
        type: 'custom',
        value: (email: string) => {
          if (!email) return true; // Let required validation handle empty values
          const domain = email.split('@')[1];
          return allowedDomains.includes(domain);
        },
        message: `Email must be from one of these domains: ${allowedDomains.join(', ')}`,
      });
    }

    // Async validation for checking if email exists (example)
    const { isValidating, validation: asyncValidation } = useAsyncValidation(
      async (email: string) => {
        // This would typically call an API to check if email exists
        // For now, we'll simulate with a timeout
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Example: check if email is already taken
        const existingEmails = ['test@example.com', 'admin@example.com'];
        const isTaken = existingEmails.includes(email.toLowerCase());
        
        return {
          isValid: !isTaken,
          errors: isTaken ? ['This email is already registered'] : [],
        };
      }
    );

    return (
      <div className="relative">
        <FormInput
          ref={ref}
          {...props}
          type="email"
          validation={validationRules}
          icon={<Mail className="h-4 w-4" />}
          className={cn(
            'pl-10', // Make room for the icon
            className
          )}
        />
        
        {/* Validation Status Indicator */}
        {props.value && !props.error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            ) : asyncValidation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
        
        {/* Domain Suggestions */}
        {validateDomain && allowedDomains.length > 0 && (
          <div className="mt-1">
            <p className="text-xs text-gray-500">
              Allowed domains: {allowedDomains.join(', ')}
            </p>
          </div>
        )}
        
        {/* Async Validation Error */}
        {!asyncValidation.isValid && asyncValidation.errors.length > 0 && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {asyncValidation.errors[0]}
          </div>
        )}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';