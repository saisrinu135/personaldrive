import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/Input';
import { FormInputProps } from '@/types/component.types';
import { useFieldValidation } from '@/hooks/useValidation';
import { cn } from '@/lib/utils';

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    name, 
    validation = [], 
    showValidation = true, 
    className,
    onChange,
    onBlur,
    value: controlledValue,
    error: externalError,
    required,
    ...props 
  }, ref) => {
    const isControlled = controlledValue !== undefined;
    
    // Initialize with the controlled value or empty string
    const initialValue = isControlled ? controlledValue : '';
    
    // Use internal validation hook
    const {
      value: internalValue,
      validation: internalValidation,
      touched,
      setValue: setInternalValue,
      validateValue,
    } = useFieldValidation(
      initialValue,
      validation,
      showValidation
    );

    // Use controlled value if provided, otherwise use internal state
    const value = isControlled ? controlledValue : internalValue;
    
    // Determine error state - prioritize external error, then internal validation
    const error = externalError || (touched && showValidation ? internalValidation.errors[0] : undefined);
    const hasError = Boolean(error);
    
    // Check if valid: no errors, has been touched, validation passed, and has content
    const isValid = !hasError && touched && internalValidation.isValid && value.length > 0;

    // Determine variant based on validation state
    const variant = hasError ? 'error' : (isValid ? 'success' : 'default');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Always update internal state for validation tracking
      setInternalValue(newValue);
      
      // For controlled components, also call the external onChange
      if (isControlled && onChange) {
        onChange(newValue);
      }
    };

    const handleBlurEvent = (e: React.FocusEvent<HTMLInputElement>) => {
      // Mark as touched and validate the current value
      const currentValue = isControlled ? controlledValue : internalValue;
      validateValue(currentValue);
      
      // Call external onBlur if provided
      onBlur?.();
    };

    return (
      <Input
        ref={ref}
        {...props}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlurEvent}
        error={error}
        required={required}
        variant={variant}
        className={cn(className)}
      />
    );
  }
);

FormInput.displayName = 'FormInput';