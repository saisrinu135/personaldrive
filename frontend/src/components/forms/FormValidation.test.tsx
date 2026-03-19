import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormInput } from './FormInput';
import { PasswordInput } from './PasswordInput';
import { EmailInput } from './EmailInput';
import { NameInput } from './NameInput';
import { ValidationRule } from '@/types/component.types';

/**
 * Unit tests for form components focusing on validation and error handling
 * Requirements: 1.3 (error messages for invalid credentials), 5.7 (validation error display)
 */

describe('Form Validation and Error Handling - Requirement 1.3, 5.7', () => {
  describe('FormInput - Multiple Validation Rules', () => {
    it('should validate multiple rules and show first error', async () => {
      const validationRules: ValidationRule[] = [
        { type: 'required', message: 'Field is required' },
        { type: 'minLength', value: 5, message: 'Must be at least 5 characters' },
        { type: 'email', message: 'Must be a valid email' }
      ];

      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <FormInput
            name="test"
            label="Test Field"
            type="text"
            value={value}
            onChange={setValue}
            validation={validationRules}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');
      
      // Test required validation
      fireEvent.blur(input);
      await waitFor(() => {
        expect(screen.getByText('Field is required')).toBeInTheDocument();
      });

      // Test minLength validation
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);
      await waitFor(() => {
        expect(screen.getByText('Must be at least 5 characters')).toBeInTheDocument();
      });
    });

    it('should show success state when validation passes', async () => {
      const validationRules: ValidationRule[] = [
        { type: 'required', message: 'Field is required' },
        { type: 'email', message: 'Must be a valid email' }
      ];

      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <FormInput
            name="test"
            label="Test Field"
            type="email"
            value={value}
            onChange={setValue}
            validation={validationRules}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Test Field');
      
      // Enter valid email
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(input).toHaveClass('border-green-500');
      });
    });
  });

  describe('EmailInput - Specialized Email Validation', () => {
    it('should validate email format', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <EmailInput
            name="email"
            label="Email"
            type="email"
            value={value}
            onChange={setValue}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Email');
      
      // Test invalid email
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Test valid email
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });

    it('should validate domain restrictions when enabled', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <EmailInput
            name="email"
            label="Email"
            type="email"
            value={value}
            onChange={setValue}
            validateDomain={true}
            allowedDomains={['company.com', 'example.org']}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Email');
      
      // Test disallowed domain
      fireEvent.change(input, { target: { value: 'user@gmail.com' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Email must be from one of these domains: company.com, example.org')).toBeInTheDocument();
      });

      // Test allowed domain
      fireEvent.change(input, { target: { value: 'user@company.com' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Email must be from one of these domains: company.com, example.org')).not.toBeInTheDocument();
      });
    });

    it('should show domain suggestions when domain validation is enabled', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <EmailInput
            name="email"
            label="Email"
            type="email"
            value={value}
            onChange={setValue}
            validateDomain={true}
            allowedDomains={['company.com', 'example.org']}
          />
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByText('Allowed domains: company.com, example.org')).toBeInTheDocument();
    });

    it('should show validation status indicators', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('test@example.com');
        return (
          <EmailInput
            name="email"
            label="Email"
            type="email"
            value={value}
            onChange={setValue}
          />
        );
      };

      render(<TestComponent />);
      
      // Should show check icon for valid email (using the correct class name)
      await waitFor(() => {
        const checkIcon = document.querySelector('.lucide-circle-check-big');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('NameInput - Specialized Name Validation', () => {
    it('should validate name length', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            minLength={3}
            maxLength={20}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Name');
      
      // Test too short
      fireEvent.change(input, { target: { value: 'Jo' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
      });

      // Test too long
      fireEvent.change(input, { target: { value: 'This is a very long name that exceeds the limit' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name cannot exceed 20 characters')).toBeInTheDocument();
      });

      // Test valid length
      fireEvent.change(input, { target: { value: 'John Doe' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Name must be at least 3 characters')).not.toBeInTheDocument();
        expect(screen.queryByText('Name cannot exceed 20 characters')).not.toBeInTheDocument();
      });
    });

    it('should validate character restrictions when allowSpecialChars is false', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            allowSpecialChars={false}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Name');
      
      // Test invalid characters
      fireEvent.change(input, { target: { value: 'John123' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name can only contain letters and spaces')).toBeInTheDocument();
      });

      // Test valid characters
      fireEvent.change(input, { target: { value: 'John Doe' } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Name can only contain letters and spaces')).not.toBeInTheDocument();
      });
    });

    it('should allow special characters when allowSpecialChars is true', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            allowSpecialChars={true}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Name');
      
      // Test valid name with special characters
      fireEvent.change(input, { target: { value: "O'Connor-Smith" } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText(/Name can only contain/)).not.toBeInTheDocument();
      });
    });

    it('should show character count when approaching limit', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('This is a long name that is near the limit');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            maxLength={25}
          />
        );
      };

      render(<TestComponent />);
      
      // Should show character count since we're over 80% of limit (42 chars > 20 chars which is 80% of 25)
      expect(screen.getByText('42/25 characters')).toBeInTheDocument();
    });

    it('should show error when exceeding character limit', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('This is a very long name that exceeds the limit');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            maxLength={20}
          />
        );
      };

      render(<TestComponent />);
      
      // Should show character count and error
      expect(screen.getByText('47/20 characters')).toBeInTheDocument();
      expect(screen.getByText('Too long')).toBeInTheDocument();
    });

    it('should show formatting guidelines when allowSpecialChars is false', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <NameInput
            name="name"
            label="Name"
            type="text"
            value={value}
            onChange={setValue}
            allowSpecialChars={false}
          />
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByText('Only letters and spaces are allowed')).toBeInTheDocument();
    });
  });

  describe('Password Input - Password Toggle and Strength', () => {
    it('should toggle password visibility', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <PasswordInput
            name="password"
            label="Password"
            value={value}
            onChange={setValue}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      
      // Initially should be password type
      expect(input).toHaveAttribute('type', 'password');
      
      // Click toggle button
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      
      // Click again to hide
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should show password strength indicator when enabled', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <PasswordInput
            name="password"
            label="Password"
            value={value}
            onChange={setValue}
            showStrengthIndicator={true}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByLabelText('Password');
      
      // Test weak password
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.focus(input); // Focus to show strength indicator
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });

      // Test strong password
      fireEvent.change(input, { target: { value: 'StrongP@ssw0rd!' } });
      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });
});