import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmailInput } from './EmailInput';

// Helper component for controlled tests
const ControlledEmailInput = ({ 
  initialValue = '', 
  ...props 
}: { 
  initialValue?: string;
  [key: string]: any;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <EmailInput
      {...props}
      value={value}
      onChange={setValue}
    />
  );
};

describe('EmailInput', () => {
  it('should render with email icon and proper attributes', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        placeholder="Enter your email"
      />
    );

    const input = screen.getByLabelText('Email Address');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter your email');
    
    // Check for email icon
    const emailIcon = document.querySelector('.lucide-mail');
    expect(emailIcon).toBeInTheDocument();
  });

  it('should validate email format and show error messages', async () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue="invalid-email"
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show success state for valid email', async () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue="test@example.com"
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.blur(input);

    await waitFor(() => {
      // Should show success styling
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should validate domain restrictions when enabled', async () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue="user@gmail.com"
        validateDomain={true}
        allowedDomains={['company.com', 'example.org']}
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Email must be from one of these domains: company.com, example.org')).toBeInTheDocument();
    });
  });

  it('should accept valid domain when domain validation is enabled', async () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue="user@company.com"
        validateDomain={true}
        allowedDomains={['company.com', 'example.org']}
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText('Email must be from one of these domains: company.com, example.org')).not.toBeInTheDocument();
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should display domain suggestions when domain validation is enabled', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        validateDomain={true}
        allowedDomains={['company.com', 'example.org']}
      />
    );

    expect(screen.getByText('Allowed domains: company.com, example.org')).toBeInTheDocument();
  });

  it('should show validation status indicators', async () => {
    const { rerender } = render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue=""
      />
    );

    // Test with valid email
    rerender(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        initialValue="test@example.com"
      />
    );

    await waitFor(() => {
      // Should show check icon for valid email
      const checkIcon = document.querySelector('.lucide-circle-check-big');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it('should handle required validation', async () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        required={true}
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    
    render(
      <EmailInput
        name="email"
        type="email"
        label="Email Address"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    expect(handleChange).toHaveBeenCalledWith('test@example.com');
  });

  it('should display external error when provided', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        error="This email is already registered"
      />
    );

    expect(screen.getByText('This email is already registered')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Email Address');
    expect(input).toBeDisabled();
  });

  it('should show required indicator with proper accessibility', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        required={true}
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    
    const input = screen.getByRole('textbox', { name: /Email Address/i });
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should apply custom className', () => {
    render(
      <ControlledEmailInput
        name="email"
        type="email"
        label="Email Address"
        className="custom-email-class"
      />
    );

    const input = screen.getByLabelText('Email Address');
    expect(input).toHaveClass('custom-email-class');
  });

  it('should validate multiple email formats correctly', async () => {
    const testCases = [
      { email: 'test@example.com', valid: true },
      { email: 'user.name@domain.co.uk', valid: true },
      { email: 'user+tag@example.org', valid: true },
      { email: 'invalid-email', valid: false },
      { email: '@example.com', valid: false },
      { email: 'test@', valid: false },
      { email: 'test.example.com', valid: false },
    ];

    for (const testCase of testCases) {
      const { rerender } = render(
        <ControlledEmailInput
          name="email"
          type="email"
          label="Email Address"
          initialValue={testCase.email}
        />
      );

      const input = screen.getByLabelText('Email Address');
      fireEvent.blur(input);

      if (testCase.valid) {
        await waitFor(() => {
          expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
        });
      } else {
        await waitFor(() => {
          expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
      }

      // Clean up for next iteration
      rerender(<div />);
    }
  });
});