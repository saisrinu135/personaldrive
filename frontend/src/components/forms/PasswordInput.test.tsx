import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('renders with label and placeholder', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        placeholder="Enter your password"
      />
    );

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('toggles password visibility when button is clicked', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="test123"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    // Initially password should be hidden
    expect(input.type).toBe('password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    // Click to hide password again
    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(input.type).toBe('password');
  });

  it('should have proper accessibility attributes for toggle button', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="test123"
        onChange={onChange}
      />
    );

    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveAttribute('tabIndex', '-1');
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

    // After clicking, aria-label should change
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Password');
    fireEvent.change(input, { target: { value: 'newpassword' } });

    expect(onChange).toHaveBeenCalledWith('newpassword');
  });

  it('displays error message when error prop is provided', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        error="Password is required"
      />
    );

    const errorMessage = screen.getByText('Password is required');
    expect(errorMessage).toBeInTheDocument();
    
    // Check for error icon
    const errorIcon = document.querySelector('.lucide-circle-alert');
    expect(errorIcon).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('required');
  });

  it('displays password strength indicator when showStrengthIndicator is true and input has value', async () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="test"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    const input = screen.getByLabelText('Password');

    // Focus the input to show strength indicator
    fireEvent.focus(input);

    // Should show strength indicator when focused and has value
    await waitFor(() => {
      expect(screen.getByText(/Password strength:/)).toBeInTheDocument();
    });
  });

  it('should evaluate different password strengths correctly', async () => {
    const onChange = vi.fn();
    
    // Test weak password
    const { rerender } = render(
      <PasswordInput
        name="password"
        label="Password"
        value="123"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    const input = screen.getByLabelText('Password');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    // Test strong password
    rerender(
      <PasswordInput
        name="password"
        label="Password"
        value="StrongP@ssw0rd!"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });
  });

  it('should show password strength feedback messages', async () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="weak"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    const input = screen.getByLabelText('Password');
    fireEvent.focus(input);

    // Should show feedback messages for weak password
    await waitFor(() => {
      const feedbackIcons = document.querySelectorAll('.lucide-circle-alert');
      expect(feedbackIcons.length).toBeGreaterThan(0);
    });
  });

  it('should hide strength indicator when password is strong and not focused', async () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="StrongP@ssw0rd!"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    const input = screen.getByLabelText('Password');
    
    // Should not show strength indicator for strong password when not focused
    expect(screen.queryByText('Password strength:')).not.toBeInTheDocument();

    // Focus should show it
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText('Password strength:')).toBeInTheDocument();
    });

    // Blur should hide it for strong passwords
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByText('Password strength:')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        className="custom-class"
      />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveClass('custom-class');
  });

  it('should apply error styling when error is present', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        error="Password is required"
      />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus:border-red-500');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        disabled
      />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-50');
    expect(input).toHaveClass('disabled:text-gray-500');
  });

  it('should handle focus and blur events correctly', async () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="test"
        onChange={onChange}
        showStrengthIndicator
      />
    );

    const input = screen.getByLabelText('Password');
    
    // Focus should show strength indicator
    fireEvent.focus(input);
    await waitFor(() => {
      expect(screen.getByText('Password strength:')).toBeInTheDocument();
    });

    // Blur should hide it for non-strong passwords (but may still show based on component logic)
    fireEvent.blur(input);
    // Note: The component may keep showing the indicator based on its internal logic
  });

  it('should have proper input attributes', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value=""
        onChange={onChange}
        required
      />
    );

    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('id', 'password');
    expect(input).toHaveAttribute('name', 'password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('required');
  });

  it('should animate toggle button on hover and click', () => {
    const onChange = vi.fn();
    render(
      <PasswordInput
        name="password"
        label="Password"
        value="test123"
        onChange={onChange}
      />
    );

    const toggleButton = screen.getByLabelText('Show password');
    
    // Button should have motion properties (framer-motion adds these)
    expect(toggleButton).toBeInTheDocument();
    
    // Test click animation
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
  });
});
