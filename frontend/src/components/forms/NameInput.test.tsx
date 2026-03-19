import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NameInput } from './NameInput';

// Helper component for controlled tests
const ControlledNameInput = ({ 
  initialValue = '', 
  ...props 
}: { 
  initialValue?: string;
  [key: string]: any;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <NameInput
      {...props}
      value={value}
      onChange={setValue}
    />
  );
};

describe('NameInput', () => {
  it('should render with user icon and proper attributes', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        placeholder="Enter your name"
      />
    );

    const input = screen.getByLabelText('Full Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
    
    // Check for user icon
    const userIcon = document.querySelector('.lucide-user');
    expect(userIcon).toBeInTheDocument();
  });

  it('should validate minimum length and show error messages', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="Jo"
        minLength={3}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('should validate maximum length and show error messages', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="This is a very long name that exceeds the maximum allowed length"
        maxLength={20}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name cannot exceed 20 characters')).toBeInTheDocument();
    });
  });

  it('should show success state for valid name length', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="John Doe"
        minLength={3}
        maxLength={20}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should validate character restrictions when allowSpecialChars is false', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="John123"
        allowSpecialChars={false}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name can only contain letters and spaces')).toBeInTheDocument();
    });
  });

  it('should accept valid characters when allowSpecialChars is false', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="John Doe"
        allowSpecialChars={false}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText('Name can only contain letters and spaces')).not.toBeInTheDocument();
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should allow special characters when allowSpecialChars is true', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="O'Connor-Smith"
        allowSpecialChars={true}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText(/Name can only contain/)).not.toBeInTheDocument();
      expect(input).toHaveClass('border-green-500');
    });
  });

  it('should show character count when approaching limit', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="This is a long name that is near the limit"
        maxLength={25}
      />
    );

    // Should show character count since we're over 80% of limit (42 chars > 20 chars which is 80% of 25)
    expect(screen.getByText('42/25 characters')).toBeInTheDocument();
  });

  it('should show error when exceeding character limit', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="This is a very long name that exceeds the limit"
        maxLength={20}
      />
    );

    // Should show character count and error
    expect(screen.getByText('47/20 characters')).toBeInTheDocument();
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });

  it('should not show character count when below 80% of limit', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="Short name"
        maxLength={50}
      />
    );

    // Should not show character count since we're below 80% of limit (10 chars < 40 chars which is 80% of 50)
    expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
  });

  it('should show formatting guidelines when allowSpecialChars is false', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        allowSpecialChars={false}
      />
    );

    expect(screen.getByText('Only letters and spaces are allowed')).toBeInTheDocument();
  });

  it('should not show formatting guidelines when allowSpecialChars is true', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        allowSpecialChars={true}
      />
    );

    expect(screen.queryByText('Only letters and spaces are allowed')).not.toBeInTheDocument();
  });

  it('should handle required validation', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        required={true}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    
    render(
      <NameInput
        name="name"
        type="text"
        label="Full Name"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.change(input, { target: { value: 'John Doe' } });

    expect(handleChange).toHaveBeenCalledWith('John Doe');
  });

  it('should display external error when provided', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        error="Name is already taken"
      />
    );

    expect(screen.getByText('Name is already taken')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Full Name');
    expect(input).toBeDisabled();
  });

  it('should show required indicator with proper accessibility', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        required={true}
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    
    const input = screen.getByRole('textbox', { name: /Full Name/i });
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should apply custom className', () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        className="custom-name-class"
      />
    );

    const input = screen.getByLabelText('Full Name');
    expect(input).toHaveClass('custom-name-class');
  });

  it('should validate various name patterns correctly', async () => {
    const testCases = [
      { name: 'John', allowSpecial: false, valid: true },
      { name: 'John Doe', allowSpecial: false, valid: true },
      { name: 'Mary Jane Smith', allowSpecial: false, valid: true },
      { name: 'John123', allowSpecial: false, valid: false },
      { name: 'John@Doe', allowSpecial: false, valid: false },
      { name: "O'Connor", allowSpecial: true, valid: true },
      { name: 'Smith-Jones', allowSpecial: true, valid: true },
      { name: "Mary-Jane O'Connor", allowSpecial: true, valid: true },
      { name: 'John123', allowSpecial: true, valid: false }, // Numbers still not allowed
    ];

    for (const testCase of testCases) {
      const { rerender } = render(
        <ControlledNameInput
          name="name"
          type="text"
          label="Full Name"
          initialValue={testCase.name}
          allowSpecialChars={testCase.allowSpecial}
        />
      );

      const input = screen.getByRole('textbox', { name: /Full Name/i });
      fireEvent.blur(input);

      if (testCase.valid) {
        await waitFor(() => {
          expect(screen.queryByText(/Name can only contain/)).not.toBeInTheDocument();
        });
      } else {
        await waitFor(() => {
          const errorMessage = testCase.allowSpecial 
            ? 'Name can only contain letters, spaces, hyphens, and apostrophes'
            : 'Name can only contain letters and spaces';
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
      }

      // Clean up for next iteration
      rerender(<div />);
    }
  });

  it('should use default length constraints when not specified', async () => {
    render(
      <ControlledNameInput
        name="name"
        type="text"
        label="Full Name"
        initialValue="A" // Single character, should fail default minLength of 2
      />
    );

    const input = screen.getByLabelText('Full Name');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });
});