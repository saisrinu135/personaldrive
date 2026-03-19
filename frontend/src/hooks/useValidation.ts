import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { ValidationRule, ValidationResult } from '@/types/component.types';
import { validateField, validateForm, isFormValid, createDebouncedValidator, createAsyncDebouncedValidator } from '@/lib/validation';

// Hook for single field validation
export function useFieldValidation(
  initialValue: string = '',
  rules: ValidationRule[] = [],
  realTime: boolean = true
) {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [touched, setTouched] = useState(false);

  // Create debounced validator for real-time validation
  const debouncedValidator = useCallback(
    createDebouncedValidator((val: string) => validateField(val, rules), 300),
    [rules]
  );

  // Validate field with given value (for controlled components)
  const validateValue = useCallback((valueToValidate: string) => {
    setTouched(true);  // Mark as touched when validating
    const result = validateField(valueToValidate, rules);
    setValidation(result);
    return result;
  }, [rules]);

  // Validate current internal value
  const validate = useCallback(() => {
    return validateValue(value);
  }, [value, validateValue]);

  // Handle value change
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      setTouched(true);

      if (realTime && touched) {
        debouncedValidator(newValue, setValidation);
      }
    },
    [realTime, touched, debouncedValidator]
  );

  // Handle blur event
  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  // Reset field
  const reset = useCallback(() => {
    setValue(initialValue);
    setValidation({ isValid: true, errors: [] });
    setTouched(false);
  }, [initialValue]);

  // Update validation when initialValue changes (for controlled components)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    validation,
    touched,
    setValue: handleChange,
    onBlur: handleBlur,
    validate,
    validateValue,
    reset,
    isValid: validation.isValid,
    errors: validation.errors,
  };
}

// Hook for form validation with Zod schema
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialData: Partial<T> = {}
) {
  const [data, setData] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate entire form
  const validate = useCallback((): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string[]> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          if (!newErrors[path]) {
            newErrors[path] = [];
          }
          newErrors[path].push(err.message);
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [data, schema]);

  // Validate single field
  const validateField = useCallback(
    (fieldName: string): boolean => {
      try {
        // Extract field schema from main schema
        const fieldValue = data[fieldName as keyof T];
        
        // For partial validation, we'll validate the entire form
        // but only show errors for the specific field
        schema.parse(data);
        
        // Clear errors for this field if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues
            .filter((err) => err.path.join('.') === fieldName)
            .map((err) => err.message);
          
          if (fieldErrors.length > 0) {
            setErrors((prev) => ({
              ...prev,
              [fieldName]: fieldErrors,
            }));
            return false;
          }
        }
        return true;
      }
    },
    [data, schema]
  );

  // Update field value
  const setFieldValue = useCallback(
    (fieldName: string, value: any, shouldValidate: boolean = true) => {
      setData((prev) => ({ ...prev, [fieldName]: value }));
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      if (shouldValidate && touched[fieldName]) {
        // Debounce field validation
        setTimeout(() => validateField(fieldName), 300);
      }
    },
    [touched, validateField]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      validateField(fieldName);
    },
    [validateField]
  );

  // Submit form
  const handleSubmit = useCallback(
    async (onSubmit: (data: T) => Promise<void> | void) => {
      setIsSubmitting(true);
      
      // Mark all fields as touched
      const allFields = Object.keys(data);
      const touchedState = allFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(touchedState);

      try {
        if (validate()) {
          await onSubmit(data as T);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [data, validate]
  );

  // Reset form
  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback(
    (fieldName: string) => ({
      value: data[fieldName as keyof T] || '',
      onChange: (value: any) => setFieldValue(fieldName, value),
      onBlur: () => handleFieldBlur(fieldName),
      error: touched[fieldName] ? errors[fieldName]?.[0] : undefined,
      errors: touched[fieldName] ? errors[fieldName] || [] : [],
    }),
    [data, errors, touched, setFieldValue, handleFieldBlur]
  );

  const isValid = Object.keys(errors).length === 0;

  return {
    data,
    errors,
    touched,
    isSubmitting,
    isValid,
    setFieldValue,
    handleFieldBlur,
    handleSubmit,
    validate,
    validateField,
    reset,
    getFieldProps,
  };
}

// Hook for async validation (e.g., checking if email exists)
export function useAsyncValidation<T>(
  validator: (value: T) => Promise<ValidationResult>,
  delay: number = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [] });

  const validate = useCallback(
    async (value: T) => {
      setIsValidating(true);
      
      try {
        const result = await validator(value);
        setValidation(result);
        return result;
      } finally {
        setIsValidating(false);
      }
    },
    [validator]
  );

  // Debounced validation
  const debouncedValidate = useCallback(
    createAsyncDebouncedValidator(
      async (value: T) => {
        setIsValidating(true);
        try {
          return await validator(value);
        } finally {
          setIsValidating(false);
        }
      },
      delay
    ),
    [validator, delay]
  );

  return {
    isValidating,
    validation,
    validate,
    debouncedValidate: (value: T) => debouncedValidate(value, setValidation),
  };
}