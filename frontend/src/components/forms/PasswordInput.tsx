import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { PasswordToggleProps } from '@/types/component.types';
import { evaluatePasswordStrength, PasswordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';

const strengthColors: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const strengthLabels: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordToggleProps>(
  ({
    name,
    label,
    value,
    onChange,
    error,
    placeholder = 'Enter password',
    required = false,
    showStrengthIndicator = false,
    className,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const passwordStrength = showStrengthIndicator ? evaluatePasswordStrength(value) : null;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const getStrengthWidth = (strength: PasswordStrength): string => {
      switch (strength) {
        case 'weak': return '25%';
        case 'fair': return '50%';
        case 'good': return '75%';
        case 'strong': return '100%';
        default: return '0%';
      }
    };

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={name}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={required}
            className={cn(
              'w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          
          <motion.button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? 'eye-off' : 'eye'}
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Password Strength Indicator */}
        {showStrengthIndicator && value && (isFocused || passwordStrength?.strength !== 'strong') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Password strength:</span>
              <span className={cn(
                'text-xs font-medium',
                passwordStrength?.strength === 'weak' && 'text-red-600',
                passwordStrength?.strength === 'fair' && 'text-orange-600',
                passwordStrength?.strength === 'good' && 'text-yellow-600',
                passwordStrength?.strength === 'strong' && 'text-green-600'
              )}>
                {passwordStrength ? strengthLabels[passwordStrength.strength] : 'Weak'}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={cn(
                  'h-2 rounded-full',
                  passwordStrength ? strengthColors[passwordStrength.strength] : 'bg-red-500'
                )}
                initial={{ width: 0 }}
                animate={{ 
                  width: passwordStrength ? getStrengthWidth(passwordStrength.strength) : '25%' 
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 100, 
                  damping: 15,
                  duration: 0.3 
                }}
              />
            </div>

            {passwordStrength && passwordStrength.feedback.length > 0 && (
              <div className="space-y-1">
                {passwordStrength.feedback.map((feedback, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />
                    {feedback}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';