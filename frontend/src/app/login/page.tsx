'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FormContainer } from '@/components/forms/FormContainer';
import { EmailInput } from '@/components/forms/EmailInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { LoginFormData } from '@/types/form.types';
import { ValidationRule } from '@/types/component.types';
import { validateForm, isFormValid } from '@/lib/validation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Clear errors only when form data explicitly changes
  useEffect(() => {
    setFormErrors({});
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const validationRules: Record<keyof LoginFormData, ValidationRule[]> = {
    email: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email address' },
    ],
    password: [
      { type: 'required', message: 'Password is required' },
      { type: 'minLength', value: 6, message: 'Password must be at least 6 characters' },
    ],
  };

  const handleInputChange = (field: keyof LoginFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationResults = validateForm(formData, validationRules);
    const isValid = isFormValid(validationResults);
    
    if (!isValid) {
      // Convert ValidationResult errors to simple string errors
      const errors: Record<string, string> = {};
      Object.entries(validationResults).forEach(([field, result]) => {
        if (!result.isValid && result.errors.length > 0) {
          errors[field] = result.errors[0];
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password);
      // Redirect will happen via useEffect when isAuthenticated becomes true
    } catch (err) {
      // Error is handled by AuthContext and displayed via error state
      // Removing console.error to satisfy ESLint no-console
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold text-gray-900"
          >
            Sign in to your account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-2 text-sm text-gray-600"
          >
            Access your personal cloud storage
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <EmailInput
                type="email"
                name="email"
                label="Email address"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={formErrors.email}
                placeholder="Enter your email"
                required
                validation={validationRules.email}
              />
            </div>

            {/* Password Field */}
            <div>
              <PasswordInput
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={formErrors.password}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}