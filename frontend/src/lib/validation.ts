import { z } from 'zod';
import { ValidationRule, ValidationResult } from '@/types/component.types';

// Common validation patterns
export const commonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  name: /^[a-zA-Z\s'-]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
} as const;

// Password strength levels
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

/**
 * Validates a single field using validation rules
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(rule.message);
        }
        break;

      case 'email':
        if (value && !commonPatterns.email.test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'minLength':
        if (value && value.length < rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'maxLength':
        if (value && value.length > rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'pattern':
        if (value && rule.value && !rule.value.test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'custom':
        if (rule.value && typeof rule.value === 'function') {
          const result = rule.value(value);
          if (!result) {
            errors.push(rule.message);
          }
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple fields using validation rules
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validationRules: Record<keyof T, ValidationRule[]>
): Record<keyof T, ValidationResult> {
  const results = {} as Record<keyof T, ValidationResult>;

  for (const field in validationRules) {
    results[field] = validateField(data[field], validationRules[field]);
  }

  return results;
}

/**
 * Checks if form validation results are all valid
 */
export function isFormValid<T extends Record<string, any>>(
  validationResults: Record<keyof T, ValidationResult>
): boolean {
  return Object.values(validationResults).every((result) => result.isValid);
}

/**
 * Evaluates password strength
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: ['Password is required'],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters (@$!%*?&)');
  }

  // Determine strength
  let strength: PasswordStrength;
  if (score <= 1) {
    strength = 'weak';
  } else if (score <= 2) {
    strength = 'fair';
  } else if (score <= 3) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { strength, score, feedback };
}

/**
 * Debounced validation function for real-time validation
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => ValidationResult,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;

  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
}

/**
 * Async debounced validation function for real-time validation
 */
export function createAsyncDebouncedValidator<T>(
  validator: (value: T) => Promise<ValidationResult>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;

  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const result = await validator(value);
      callback(result);
    }, delay);
  };
}