'use client';

import React, { forwardRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        error: 'text-destructive',
        success: 'text-green-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<HTMLMotionProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    label, 
    error, 
    helperText, 
    icon, 
    required, 
    type = 'text',
    id,
    value,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Determine the actual variant based on error state
    const actualVariant = error ? 'error' : variant;
    
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    // Build aria-describedby for accessibility
    const ariaDescribedBy = [
      helperText ? helperId : null,
      error ? errorId : null,
    ].filter(Boolean).join(' ') || undefined;
    
    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            htmlFor={inputId}
            className={cn(labelVariants({ variant: actualVariant }))}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
          </motion.label>
        )}
        
        <div className="relative">
          {icon && (
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            id={inputId}
            type={type}
            value={value !== undefined ? value : (props.onChange ? '' : undefined)}
            required={required}
            aria-describedby={ariaDescribedBy}
            aria-invalid={Boolean(error)}
            aria-required={required}
            className={cn(
              inputVariants({ variant: actualVariant, size, className }),
              icon && 'pl-10',
              'peer'
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            {...props}
          />
        </div>
        
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {error && (
              <p 
                id={errorId}
                className="text-sm text-destructive font-medium"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p 
                id={helperId}
                className="text-sm text-muted-foreground"
              >
                {helperText}
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };