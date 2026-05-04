'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EmailInput } from '@/components/forms/EmailInput';
import { NameInput } from '@/components/forms/NameInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterFormData } from '@/types/form.types';
import { ValidationRule } from '@/types/component.types';
import { validateForm, isFormValid } from '@/lib/validation';
import Link from 'next/link';
import { Cloud, ShieldCheck, Globe, Lock, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Clear errors when form data changes
  useEffect(() => {
    setFormErrors({});
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const validationRules: Record<keyof RegisterFormData, ValidationRule[]> = {
    name: [
      { type: 'required', message: 'Name is required' },
      { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
      { type: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' },
    ],
    email: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email address' },
    ],
    password: [
      { type: 'required', message: 'Password is required' },
      { type: 'minLength', value: 6, message: 'Password must be at least 6 characters' },
    ],
    confirmPassword: [
      { type: 'required', message: 'Please confirm your password' },
      {
        type: 'custom',
        value: (confirmPassword: string) => confirmPassword === formData.password,
        message: 'Passwords do not match',
      },
    ],
  };

  const handleInputChange = (field: keyof RegisterFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setFormErrors(prev => ({ ...prev, terms: 'You must agree to the Terms of Service and Privacy Policy' }));
      return;
    }

    const validationResults = validateForm(formData, validationRules);
    const isValid = isFormValid(validationResults);

    if (!isValid) {
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
      await register(formData.name, formData.email, formData.password);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Branding Panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              Cloud<span className="text-blue-200">Vault</span>
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-snug">
            Create your account
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Start your journey with CloudVault
          </p>

          <div className="space-y-3 mt-8">
            {[
              { icon: ShieldCheck, label: 'Enterprise-grade security for your files' },
              { icon: Globe, label: 'Access from any device, anywhere' },
              { icon: Lock, label: 'Your data, always encrypted' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-100 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom illustration */}
        <div className="relative flex justify-center">
          <div className="w-64 h-40 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <div className="text-center">
              <Cloud className="w-12 h-12 text-white/60 mx-auto mb-2" />
              <p className="text-white/60 text-xs">Free to get started</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16 overflow-y-auto"
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Cloud className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl text-foreground">
            Cloud<span className="text-primary">Vault</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
            <p className="text-muted-foreground text-sm">Start your journey with CloudVault</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <NameInput
                type="text"
                name="name"
                label="Full name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={formErrors.name}
                placeholder="Aman Raj"
                required
                validation={validationRules.name}
                minLength={2}
                maxLength={100}
              />
            </div>

            <div>
              <EmailInput
                type="email"
                name="email"
                label="Email address"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={formErrors.email}
                placeholder="amara@example.com"
                required
                validation={validationRules.email}
              />
            </div>

            <div>
              <PasswordInput
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={formErrors.password}
                placeholder="••••••••"
                required
                showStrengthIndicator={true}
              />
            </div>

            <div>
              <PasswordInput
                name="confirmPassword"
                label="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={formErrors.confirmPassword}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Terms agreement */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background accent-primary"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:text-primary/80 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary/80 font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {formErrors.terms && (
                <p className="mt-1 text-xs text-destructive">{formErrors.terms}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="default"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
                id="register-submit-btn"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}