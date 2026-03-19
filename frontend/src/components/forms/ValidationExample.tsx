import React from 'react';
import { useFormValidation } from '@/hooks/useValidation';
import { registerSchema } from '@/lib/schemas';
import { FormInput, PasswordInput, NameInput, EmailInput, FormContainer } from '@/components/forms';
import { Button } from '@/components/ui/Button';

/**
 * Example component demonstrating the validation system
 * This shows how to use the validation hooks and form components together
 */
export const ValidationExample: React.FC = () => {
  const {
    data,
    errors,
    touched,
    isSubmitting,
    isValid,
    getFieldProps,
    handleSubmit,
    reset,
  } = useFormValidation(registerSchema, {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const onSubmit = async (formData: typeof data) => {
    console.log('Form submitted with data:', formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Registration successful!');
    reset();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Validation System Demo</h2>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit);
      }} className="space-y-4">
        
        {/* Name Input with validation */}
        <NameInput
          name="name"
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          required
          {...getFieldProps('name')}
        />
        
        {/* Email Input with validation */}
        <EmailInput
          name="email"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          required
          {...getFieldProps('email')}
        />
        
        {/* Password Input with strength indicator */}
        <PasswordInput
          name="password"
          label="Password"
          placeholder="Create a strong password"
          required
          showStrengthIndicator
          {...getFieldProps('password')}
        />
        
        {/* Confirm Password Input */}
        <PasswordInput
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          required
          {...getFieldProps('confirmPassword')}
        />
        
        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
        
        {/* Reset Button */}
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={reset}
          className="w-full"
        >
          Reset Form
        </Button>
      </form>
      
      {/* Debug Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded text-xs">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Form Valid: {isValid ? '✅' : '❌'}</p>
        <p>Submitting: {isSubmitting ? '⏳' : '✅'}</p>
        <p>Errors: {Object.keys(errors).length}</p>
        <p>Touched Fields: {Object.keys(touched).filter(key => touched[key]).length}</p>
      </div>
    </div>
  );
};