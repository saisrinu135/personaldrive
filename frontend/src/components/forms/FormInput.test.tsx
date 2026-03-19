import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormInput } from './FormInput';
import { ValidationRule } from '@/types/component.types';

// Helper component for controlled tests
const ControlledFormInput = ({ 
  initialValue = '', 
  ...props 
}: { 
  initialValue?: string;
  [key: string]: any;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <FormInput
      {...props}
      value={value}
      onChange={setValue}
    />
  );
};

describe('FormInput', () => {
  it('should render with label and placeholder', () => {
    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        placeholder="Enter test value"
      />
    );

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter test value')).toBeInTheDocument();
  });

  it('should display validation errors with proper accessibility attributes', async () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: 'Must be at least 5 characters' }
    ];

    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        initialValue="abc"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Test Input');
    
    // Trigger blur to show validation
    fireEvent.blur(input);
    
    await waitFor(() => {
      const errorMessage = screen.getByText('Must be at least 5 characters');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should display required validation errors', async () => {
    const rules: ValidationRule[] = [
      { type: 'required', message: 'This field is required' }
    ];

    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Test Input');
    
    // Trigger blur to show validation
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should show success state for valid input', async () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 3, message: 'Must be at least 3 characters' }
    ];

    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        initialValue="valid input"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Test Input');
    
    // Trigger blur to show validation
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'false');
      // Check for success styling (green border)
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    
    render(
      <FormInput
        name="test"
        type="text"
        label="Test Input"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Test Input');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(handleChange).toHaveBeenCalledWith('new value');
  });

  it('should show external error when provided', () => {
    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        error="External error message"
      />
    );

    const errorMessage = screen.getByText('External error message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Test Input');
    expect(input).toBeDisabled();
  });

  it('should show required indicator with proper accessibility', () => {
    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        required={true}
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    
    // The input should be accessible by the full label text
    const input = screen.getByRole('textbox', { name: /Test Input/i });
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should validate email format', async () => {
    const rules: ValidationRule[] = [
      { type: 'email', message: 'Invalid email format' }
    ];

    render(
      <ControlledFormInput
        name="email"
        type="email"
        label="Email"
        initialValue="invalid-email"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Email');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('should validate pattern matching', async () => {
    const rules: ValidationRule[] = [
      { type: 'pattern', value: /^\d+$/, message: 'Numbers only' }
    ];

    render(
      <ControlledFormInput
        name="numbers"
        type="text"
        label="Numbers Only"
        initialValue="abc123"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Numbers Only');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Numbers only')).toBeInTheDocument();
    });
  });

  it('should validate custom rules', async () => {
    const rules: ValidationRule[] = [
      { 
        type: 'custom', 
        value: (val: string) => val === 'valid',
        message: 'Must be "valid"' 
      }
    ];

    render(
      <ControlledFormInput
        name="custom"
        type="text"
        label="Custom Validation"
        initialValue="invalid"
        validation={rules}
        showValidation={true}
      />
    );

    const input = screen.getByLabelText('Custom Validation');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Must be "valid"')).toBeInTheDocument();
    });
  });

  it('should provide proper aria-describedby for helper text', () => {
    render(
      <ControlledFormInput
        name="test"
        type="text"
        label="Test Input"
        helperText="This is helper text"
      />
    );

    const input = screen.getByLabelText('Test Input');
    const helperText = screen.getByText('This is helper text');
    
    expect(input).toHaveAttribute('aria-describedby');
    expect(helperText).toHaveAttribute('id');
  });

  it('should handle real-time validation feedback', async () => {
    const rules: ValidationRule[] = [
      { type: 'minLength', value: 5, message: 'Must be at least 5 characters' }
    ];

    const TestComponent = () => {
      const [value, setValue] = useState('');
      return (
        <FormInput
          name="test"
          type="text"
          label="Test Input"
          value={value}
          onChange={setValue}
          validation={rules}
          showValidation={true}
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Test Input');
    
    // First blur to mark as touched
    fireEvent.blur(input);
    
    // Then type to trigger real-time validation
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.getByText('Must be at least 5 characters')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Type more to make it valid
    fireEvent.change(input, { target: { value: 'abcdef' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      expect(screen.queryByText('Must be at least 5 characters')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});