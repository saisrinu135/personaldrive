'use client';

import React, { useState } from 'react';
import { PasswordInput } from './PasswordInput';
import { Card } from '@/components/ui/Card';

/**
 * Example component demonstrating PasswordInput usage
 * This component showcases:
 * - Basic password input with show/hide toggle
 * - Password strength indicator
 * - Animated toggle icon with framer-motion
 * - Error handling
 */
export const PasswordToggleExample: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && value !== password) {
      setError('Passwords do not match');
    } else {
      setError('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <Card padding="lg">
        <h2 className="text-2xl font-bold mb-6">Password Toggle Examples</h2>
        
        <div className="space-y-6">
          {/* Basic password input */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Password Input</h3>
            <PasswordInput
              name="basic-password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Password with strength indicator */}
          <div>
            <h3 className="text-lg font-semibold mb-3">With Strength Indicator</h3>
            <PasswordInput
              name="password-with-strength"
              label="New Password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Create a strong password"
              showStrengthIndicator
              required
            />
          </div>

          {/* Confirm password with error */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Confirm Password</h3>
            <PasswordInput
              name="confirm-password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Re-enter your password"
              error={error}
              required
            />
          </div>

          {/* Usage notes */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">Features:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Animated toggle icon with framer-motion</li>
              <li>Show/hide password functionality</li>
              <li>Optional password strength indicator</li>
              <li>Real-time validation feedback</li>
              <li>Accessible with ARIA labels</li>
              <li>Smooth animations on toggle and strength bar</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
