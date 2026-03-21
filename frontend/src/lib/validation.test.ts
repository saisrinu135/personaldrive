import { describe, it, expect } from 'vitest';
import {
  validateField,
  validateForm,
  isFormValid,
  evaluatePasswordStrength,
  createDebouncedValidator,
} from './validation';
import { ValidationRule } from '@/types/component.types';

describe('validateField', () => {
  it('should validate required fields', () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'Field is required' }
    ];

    expect(validateField('', rules)).toEqual({
      isValid: false,
      errors: ['Field is required']
    });

    expect(validateField('value', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should validate email format', () => {
    const rules: ValidationRule[] = [
      { type: 'email', message: 'Invalid email' }
    ];

    expect(validateField('invalid-email', rules)).toEqual({
      isValid: false,
      errors: ['Invalid email']
    });

    expect(validateField('test@example.com', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should validate minimum length', () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: 'Too short' }
    ];

    expect(validateField('abc', rules)).toEqual({
      isValid: false,
      errors: ['Too short']
    });

    expect(validateField('abcdef', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should validate maximum length', () => {
    const rules: ValidationRule[] = [
      { type: 'maxLength', value: 5, message: 'Too long' }
    ];

    expect(validateField('abcdef', rules)).toEqual({
      isValid: false,
      errors: ['Too long']
    });

    expect(validateField('abc', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should validate pattern', () => {
    const rules: ValidationRule[] = [
      { type: 'pattern', value: /^\d+$/, message: 'Numbers only' }
    ];

    expect(validateField('abc123', rules)).toEqual({
      isValid: false,
      errors: ['Numbers only']
    });

    expect(validateField('123', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should validate custom rules', () => {
    const rules: ValidationRule[] = [
      { 
        type: 'custom', 
        value: (val: string) => val === 'valid',
        message: 'Must be "valid"' 
      }
    ];

    expect(validateField('invalid', rules)).toEqual({
      isValid: false,
      errors: ['Must be "valid"']
    });

    expect(validateField('valid', rules)).toEqual({
      isValid: true,
      errors: []
    });
  });

  it('should handle multiple validation errors', () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'Required' },
      { type: 'minLength', value: 5, message: 'Too short' }
    ];

    expect(validateField('', rules)).toEqual({
      isValid: false,
      errors: ['Required']
    });

    expect(validateField('abc', rules)).toEqual({
      isValid: false,
      errors: ['Too short']
    });
  });
});

describe('validateForm', () => {
  it('should validate multiple fields', () => {
    const data = {
      email: 'invalid-email',
      password: 'abc'
    };

    const rules = {
      email: [{ type: 'email' as const, message: 'Invalid email' }],
      password: [{ type: 'minLength' as const, value: 8, message: 'Too short' }]
    };

    const result = validateForm(data, rules);

    expect(result.email.isValid).toBe(false);
    expect(result.password.isValid).toBe(false);
  });
});

describe('isFormValid', () => {
  it('should return true when all fields are valid', () => {
    const results = {
      email: { isValid: true, errors: [] },
      password: { isValid: true, errors: [] }
    };

    expect(isFormValid(results)).toBe(true);
  });

  it('should return false when any field is invalid', () => {
    const results = {
      email: { isValid: true, errors: [] },
      password: { isValid: false, errors: ['Too short'] }
    };

    expect(isFormValid(results)).toBe(false);
  });
});

describe('evaluatePasswordStrength', () => {
  it('should evaluate weak passwords', () => {
    const result = evaluatePasswordStrength('abc');
    expect(result.strength).toBe('weak');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should evaluate strong passwords', () => {
    const result = evaluatePasswordStrength('StrongP@ssw0rd');
    expect(result.strength).toBe('strong');
    expect(result.score).toBe(5);
    expect(result.feedback.length).toBe(0);
  });

  it('should handle empty passwords', () => {
    const result = evaluatePasswordStrength('');
    expect(result.strength).toBe('weak');
    expect(result.score).toBe(0);
    expect(result.feedback).toContain('Password is required');
  });

  it('should provide specific feedback', () => {
    const result = evaluatePasswordStrength('password');
    expect(result.feedback).toContain('Include uppercase letters');
    expect(result.feedback).toContain('Include numbers');
    expect(result.feedback).toContain('Include special characters (@$!%*?&)');
  });
});

describe('createDebouncedValidator', () => {
  it('should debounce validation calls', (done) => {
    let callCount = 0;
    const validator = (value: string) => {
      callCount++;
      return { isValid: true, errors: [] };
    };

    const debouncedValidator = createDebouncedValidator(validator, 100);

    // Make multiple rapid calls
    debouncedValidator('test1', () => {});
    debouncedValidator('test2', () => {});
    debouncedValidator('test3', (result) => {
      expect(callCount).toBe(1); // Should only be called once
      expect(result.isValid).toBe(true);
      done();
    });
  });
});