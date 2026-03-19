import React, { forwardRef } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { NameInputProps } from '@/types/component.types';
import { FormInput } from './FormInput';
import { ValidationRule } from '@/types/component.types';
import { commonPatterns } from '@/lib/validation';
import { cn } from '@/lib/utils';

export const NameInput = forwardRef<HTMLInputElement, NameInputProps>(
  ({
    minLength = 2,
    maxLength = 100,
    allowSpecialChars = true,
    className,
    ...props
  }, ref) => {
    // Create validation rules
    const validationRules: ValidationRule[] = [
      {
        type: 'required',
        message: 'Name is required',
      },
      {
        type: 'minLength',
        value: minLength,
        message: `Name must be at least ${minLength} characters`,
      },
      {
        type: 'maxLength',
        value: maxLength,
        message: `Name cannot exceed ${maxLength} characters`,
      },
      ...(props.validation || []),
    ];

    // Add pattern validation based on allowSpecialChars
    if (!allowSpecialChars) {
      validationRules.push({
        type: 'pattern',
        value: /^[a-zA-Z\s]+$/,
        message: 'Name can only contain letters and spaces',
      });
    } else {
      validationRules.push({
        type: 'pattern',
        value: commonPatterns.name,
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      });
    }

    // Character count helper
    const currentLength = props.value?.length || 0;
    const isNearLimit = currentLength > maxLength * 0.8;

    return (
      <div className="space-y-1">
        <FormInput
          ref={ref}
          {...props}
          type="text"
          validation={validationRules}
          icon={<User className="h-4 w-4" />}
          className={cn(
            'pl-10', // Make room for the icon
            className
          )}
        />
        
        {/* Character Count */}
        {(isNearLimit || currentLength > maxLength) && (
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              'text-gray-500',
              currentLength > maxLength && 'text-red-500'
            )}>
              {currentLength}/{maxLength} characters
            </span>
            {currentLength > maxLength && (
              <div className="flex items-center text-red-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                Too long
              </div>
            )}
          </div>
        )}
        
        {/* Formatting Guidelines */}
        {!allowSpecialChars && (
          <p className="text-xs text-gray-500">
            Only letters and spaces are allowed
          </p>
        )}
      </div>
    );
  }
);

NameInput.displayName = 'NameInput';