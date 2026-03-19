import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormInput } from './FormInput';
import { PasswordInput } from './PasswordInput';
import { EmailInput } from './EmailInput';
import { NameInput } from './NameInput';
import { FormContainer } from './FormContainer';
import { ValidationRule } from '@/types/component.types';

/**
 * Comprehensive unit tests for form components
 * Task 3.5: Test form validation, error handling, and password toggle functionality
 * Requirements: 1.3 (error messages), 5.7 (validation error display)
 */

describe('Form Components - Validation and Error Handling', () => {
  describe('FormInput - Core Validation', () => {
    it('should display validation errors for required fields', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <FormInput
            name="test"
            type="text"
            label="Test Field"
            value={value}
            onChange={setValue}
            validation={[{ type: 'required', message: 'This field is required' }]}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should display validation errors for minimum length', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('ab');
        return (
          <FormInput
            name="test"
            type="text"
            label="Test Field"
            value={value}
            onChange={setValue}
            validation={[{ type: 'minLength', value: 5, message: 'Must be at least 5 characters' }]}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('ab');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Must be at least 5 characters')).toBeInTheDocument();
      });
    });

    it('should show success state when validation passes', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('valid input');
        return (
          <FormInput
            name="test"
            type="text"
            label="Test Field"
            value={value}
            onChange={setValue}
            validation={[{ type: 'minLength', value: 3, message: 'Too short' }]}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('valid input');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(input).toHaveClass('border-green-500');
      });
    });

    it('should handle external errors', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <FormInput
            name="test"
            type="text"
            label="Test Field"
            value={value}
            onChange={setValue}
            error="External error message"
          />
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('External error message')).toBeInTheDocument();
    });
  });

  describe('PasswordInput - Password Toggle Functionality', () => {
    it('should toggle password visibility when toggle button is clicked', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('password123');
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
      
      const input = screen.getByDisplayValue('password123');
      const toggleButton = screen.getByLabelText('Show password');

      // Initially password should be hidden
      expect(input).toHaveAttribute('type', 'password');

      // Click to show password
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

      // Click to hide password again
      fireEvent.click(screen.getByLabelText('Hide password'));
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should display error messages', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <PasswordInput
            name="password"
            label="Password"
            value={value}
            onChange={setValue}
            error="Password is required"
          />
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <PasswordInput
            name="password"
            label="Password"
            value={value}
            onChange={setValue}
            required
          />
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should show password strength indicator when enabled', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('test123');
        return (
          <PasswordInput
            name="password"
            label="Password"
            value={value}
            onChange={setValue}
            showStrengthIndicator
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('test123');
      
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText(/Password strength/)).toBeInTheDocument();
      });
    });

    it('should call onChange when value changes', () => {
      const onChange = vi.fn();
      
      render(
        <PasswordInput
          name="password"
          label="Password"
          value=""
          onChange={onChange}
        />
      );

      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: 'newpassword' } });

      expect(onChange).toHaveBeenCalledWith('newpassword');
    });
  });

  describe('EmailInput - Email Validation', () => {
    it('should validate email format', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('invalid-email');
        return (
          <EmailInput
            name="email"
            type="email"
            label="Email"
            value={value}
            onChange={setValue}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('invalid-email');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should accept valid email addresses', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('test@example.com');
        return (
          <EmailInput
            name="email"
            type="email"
            label="Email"
            value={value}
            onChange={setValue}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('test@example.com');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });

    it('should validate domain restrictions when enabled', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('user@gmail.com');
        return (
          <EmailInput
            name="email"
            type="email"
            label="Email"
            value={value}
            onChange={setValue}
            validateDomain={true}
            allowedDomains={['company.com']}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('user@gmail.com');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Email must be from one of these domains: company.com')).toBeInTheDocument();
      });
    });

    it('should show domain suggestions', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <EmailInput
            name="email"
            type="email"
            label="Email"
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
  });

  describe('NameInput - Name Validation', () => {
    it('should validate minimum length', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('Jo');
        return (
          <NameInput
            name="name"
            type="text"
            label="Name"
            value={value}
            onChange={setValue}
            minLength={3}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('Jo');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('should validate maximum length', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('This is a very long name');
        return (
          <NameInput
            name="name"
            type="text"
            label="Name"
            value={value}
            onChange={setValue}
            maxLength={10}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('This is a very long name');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name cannot exceed 10 characters')).toBeInTheDocument();
      });
    });

    it('should show character count when approaching limit', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('This is a long name that approaches limit');
        return (
          <NameInput
            name="name"
            type="text"
            label="Name"
            value={value}
            onChange={setValue}
            maxLength={25}
          />
        );
      };

      render(<TestComponent />);
      // Should show character count since we're over 80% of limit
      expect(screen.getByText(/41.*\/.*25.*characters/)).toBeInTheDocument();
      expect(screen.getByText('Too long')).toBeInTheDocument();
    });

    it('should validate character restrictions', async () => {
      const TestComponent = () => {
        const [value, setValue] = useState('John123');
        return (
          <NameInput
            name="name"
            type="text"
            label="Name"
            value={value}
            onChange={setValue}
            allowSpecialChars={false}
          />
        );
      };

      render(<TestComponent />);
      const input = screen.getByDisplayValue('John123');
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText('Name can only contain letters and spaces')).toBeInTheDocument();
      });
    });
  });

  describe('FormContainer - Form Submission', () => {
    it('should handle form submission with form data', async () => {
      const onSubmit = vi.fn();
      
      render(
        <FormContainer onSubmit={onSubmit}>
          <input name="username" defaultValue="testuser" />
          <input name="email" defaultValue="test@example.com" />
        </FormContainer>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
        });
      });
    });

    it('should show loading state', () => {
      const onSubmit = vi.fn();
      
      render(
        <FormContainer onSubmit={onSubmit} loading={true}>
          <div>Form content</div>
        </FormContainer>
      );

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
    });

    it('should display title and description', () => {
      const onSubmit = vi.fn();
      
      render(
        <FormContainer
          onSubmit={onSubmit}
          title="Login Form"
          description="Please enter your credentials"
        >
          <div>Form content</div>
        </FormContainer>
      );

      expect(screen.getByText('Login Form')).toBeInTheDocument();
      expect(screen.getByText('Please enter your credentials')).toBeInTheDocument();
    });
  });

  describe('Form Integration - Complete Form Scenarios', () => {
    it('should handle a complete login form with validation', async () => {
      const onSubmit = vi.fn();
      
      const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        
        return (
          <FormContainer onSubmit={onSubmit} title="Login">
            <EmailInput
              name="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
            />
            <PasswordInput
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
            />
          </FormContainer>
        );
      };

      render(<LoginForm />);

      // Fill in valid data
      const emailInput = screen.getAllByDisplayValue('')[0]; // First empty input (email)
      const passwordInput = screen.getAllByDisplayValue('')[1]; // Second empty input (password)
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should handle form validation errors', async () => {
      const onSubmit = vi.fn();
      
      const RegistrationForm = () => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        
        return (
          <FormContainer onSubmit={onSubmit} title="Register">
            <NameInput
              name="name"
              type="text"
              label="Name"
              value={name}
              onChange={setName}
              minLength={2}
            />
            <EmailInput
              name="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
            />
          </FormContainer>
        );
      };

      render(<RegistrationForm />);

      // Fill in invalid data
      const nameInput = screen.getAllByDisplayValue('')[0]; // First empty input (name)
      const emailInput = screen.getAllByDisplayValue('')[1]; // Second empty input (email)
      
      fireEvent.change(nameInput, { target: { value: 'A' } }); // Too short
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } }); // Invalid email
      
      // Trigger validation
      fireEvent.blur(nameInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });
  });
});