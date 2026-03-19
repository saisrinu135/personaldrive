import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { User, Mail, Lock } from 'lucide-react';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders basic input correctly', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'w-full', 'rounded-md');
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    const label = screen.getByText('Username');
    const input = screen.getByPlaceholderText('Enter username');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows required indicator when required prop is true', () => {
    render(<Input label="Email" required />);
    
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('text-destructive');
  });

  it('renders with icon', () => {
    render(
      <Input 
        label="Email" 
        icon={<Mail data-testid="mail-icon" />} 
        placeholder="Enter email" 
      />
    );
    
    const icon = screen.getByTestId('mail-icon');
    const input = screen.getByPlaceholderText('Enter email');
    
    expect(icon).toBeInTheDocument();
    expect(input).toHaveClass('pl-10'); // Icon padding
  });

  it('displays error message and applies error styling', () => {
    render(
      <Input 
        label="Password" 
        error="Password is required" 
        placeholder="Enter password" 
      />
    );
    
    const errorMessage = screen.getByText('Password is required');
    const input = screen.getByPlaceholderText('Enter password');
    const label = screen.getByText('Password');
    
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-destructive');
    expect(input).toHaveClass('border-destructive');
    expect(label).toHaveClass('text-destructive');
  });

  it('displays helper text when no error', () => {
    render(
      <Input 
        label="Username" 
        helperText="Must be at least 3 characters" 
        placeholder="Enter username" 
      />
    );
    
    const helperText = screen.getByText('Must be at least 3 characters');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-muted-foreground');
  });

  it('prioritizes error message over helper text', () => {
    render(
      <Input 
        label="Username" 
        error="Username is taken"
        helperText="Must be at least 3 characters" 
        placeholder="Enter username" 
      />
    );
    
    const errorMessage = screen.getByText('Username is taken');
    const helperText = screen.queryByText('Must be at least 3 characters');
    
    expect(errorMessage).toBeInTheDocument();
    expect(helperText).not.toBeInTheDocument();
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="Age" />);
    expect(screen.getByPlaceholderText('Age')).toHaveAttribute('type', 'number');
  });

  it('applies different size variants', () => {
    const { rerender } = render(<Input size="sm" placeholder="Small" />);
    expect(screen.getByPlaceholderText('Small')).toHaveClass('h-8', 'px-2', 'text-xs');

    rerender(<Input size="md" placeholder="Medium" />);
    expect(screen.getByPlaceholderText('Medium')).toHaveClass('h-10', 'px-3', 'text-sm');

    rerender(<Input size="lg" placeholder="Large" />);
    expect(screen.getByPlaceholderText('Large')).toHaveClass('h-12', 'px-4', 'text-base');
  });

  it('handles focus and blur events', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    
    render(
      <Input 
        placeholder="Test input" 
        onFocus={onFocus} 
        onBlur={onBlur} 
      />
    );
    
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('handles value changes', () => {
    const onChange = vi.fn();
    
    render(
      <Input 
        placeholder="Test input" 
        onChange={onChange} 
      />
    );
    
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('applies success variant styling', () => {
    render(
      <Input 
        variant="success" 
        label="Valid Email"
        placeholder="Email" 
      />
    );
    
    const input = screen.getByPlaceholderText('Email');
    const label = screen.getByText('Valid Email');
    
    expect(input).toHaveClass('border-green-500');
    expect(label).toHaveClass('text-green-600');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    
    render(<Input ref={ref} placeholder="Test input" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Test input');
  });

  it('generates unique ID when not provided', () => {
    render(
      <>
        <Input label="First" placeholder="First input" />
        <Input label="Second" placeholder="Second input" />
      </>
    );
    
    const firstInput = screen.getByPlaceholderText('First input');
    const secondInput = screen.getByPlaceholderText('Second input');
    
    expect(firstInput.id).toBeTruthy();
    expect(secondInput.id).toBeTruthy();
    expect(firstInput.id).not.toBe(secondInput.id);
  });

  it('uses provided ID', () => {
    render(<Input id="custom-id" label="Custom" placeholder="Custom input" />);
    
    const input = screen.getByPlaceholderText('Custom input');
    const label = screen.getByText('Custom');
    
    expect(input.id).toBe('custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('supports accessibility features', () => {
    render(
      <Input 
        label="Accessible Input"
        placeholder="Enter text"
        required
        error="This field is required"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter text');
    const label = screen.getByText('Accessible Input');
    
    // Label association
    expect(label).toHaveAttribute('for', input.id);
    
    // Required attribute
    expect(input).toHaveAttribute('required');
    
    // Error message should be associated with input
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
  });

  describe('Validation States', () => {
    it('shows default state with no validation', () => {
      render(<Input label="Default Input" placeholder="Enter text" />);
      
      const input = screen.getByPlaceholderText('Enter text');
      const label = screen.getByText('Default Input');
      
      expect(input).toHaveClass('border-input');
      expect(label).toHaveClass('text-foreground');
      expect(input).not.toHaveClass('border-destructive', 'border-green-500');
    });

    it('shows error state with error message', () => {
      render(
        <Input 
          label="Error Input" 
          placeholder="Enter text"
          error="This field has an error"
        />
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      const label = screen.getByText('Error Input');
      const errorMessage = screen.getByText('This field has an error');
      
      expect(input).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
      expect(label).toHaveClass('text-destructive');
      expect(errorMessage).toHaveClass('text-destructive', 'font-medium');
    });

    it('shows success state with success styling', () => {
      render(
        <Input 
          label="Success Input" 
          placeholder="Enter text"
          variant="success"
        />
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      const label = screen.getByText('Success Input');
      
      expect(input).toHaveClass('border-green-500', 'focus-visible:ring-green-500');
      expect(label).toHaveClass('text-green-600');
    });

    it('error state overrides other variants', () => {
      render(
        <Input 
          label="Override Test" 
          placeholder="Enter text"
          variant="success"
          error="Error overrides success"
        />
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      const label = screen.getByText('Override Test');
      
      // Error styling should override success variant
      expect(input).toHaveClass('border-destructive');
      expect(input).not.toHaveClass('border-green-500');
      expect(label).toHaveClass('text-destructive');
      expect(label).not.toHaveClass('text-green-600');
    });

    it('transitions between validation states smoothly', async () => {
      const { rerender } = render(
        <Input label="Dynamic Input" placeholder="Enter text" />
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveClass('border-input');
      
      // Change to error state
      rerender(
        <Input 
          label="Dynamic Input" 
          placeholder="Enter text" 
          error="Now has error"
        />
      );
      
      await waitFor(() => {
        expect(input).toHaveClass('border-destructive');
        expect(screen.getByText('Now has error')).toBeInTheDocument();
      });
      
      // Change to success state
      rerender(
        <Input 
          label="Dynamic Input" 
          placeholder="Enter text" 
          variant="success"
        />
      );
      
      await waitFor(() => {
        expect(input).toHaveClass('border-green-500');
        expect(screen.queryByText('Now has error')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('handles typing and input changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(
        <Input 
          label="Type Test" 
          placeholder="Type here"
          onChange={onChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'Hello World');
      
      expect(onChange).toHaveBeenCalledTimes(11); // One for each character
      expect(input).toHaveValue('Hello World');
    });

    it('handles focus and blur with visual feedback', async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      
      render(
        <Input 
          label="Focus Test" 
          placeholder="Focus me"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      
      const input = screen.getByPlaceholderText('Focus me');
      
      await user.click(input);
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(input).toHaveFocus();
      
      await user.tab(); // Move focus away
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(input).not.toHaveFocus();
    });

    it('handles paste operations', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(
        <Input 
          label="Paste Test" 
          placeholder="Paste here"
          onChange={onChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Paste here');
      
      await user.click(input);
      await user.paste('Pasted content');
      
      expect(input).toHaveValue('Pasted content');
      expect(onChange).toHaveBeenCalled();
    });

    it('handles clear and backspace operations', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(
        <Input 
          label="Clear Test" 
          placeholder="Type and clear"
          onChange={onChange}
          defaultValue="Initial text"
        />
      );
      
      const input = screen.getByPlaceholderText('Type and clear');
      expect(input).toHaveValue('Initial text');
      
      await user.clear(input);
      expect(input).toHaveValue('');
      expect(onChange).toHaveBeenCalled();
    });

    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onFocus = vi.fn();
      
      render(
        <Input 
          label="Disabled Test" 
          placeholder="Cannot interact"
          disabled
          onChange={onChange}
          onFocus={onFocus}
        />
      );
      
      const input = screen.getByPlaceholderText('Cannot interact');
      
      await user.click(input);
      expect(onFocus).not.toHaveBeenCalled();
      expect(input).not.toHaveFocus();
      
      await user.type(input, 'Should not work');
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('handles form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={onSubmit}>
          <Input 
            label="Submit Test" 
            placeholder="Press enter"
            name="testInput"
          />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByPlaceholderText('Press enter');
      
      await user.type(input, 'Test value');
      await user.keyboard('{Enter}');
      
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper label association', () => {
      render(
        <Input 
          id="accessible-input"
          label="Accessible Label" 
          placeholder="Accessible input"
        />
      );
      
      const input = screen.getByPlaceholderText('Accessible input');
      const label = screen.getByText('Accessible Label');
      
      expect(label).toHaveAttribute('for', 'accessible-input');
      expect(input).toHaveAttribute('id', 'accessible-input');
    });

    it('supports screen reader announcements for errors', () => {
      render(
        <Input 
          label="Error Announcement" 
          placeholder="Has error"
          error="This field is required"
          required
        />
      );
      
      const input = screen.getByPlaceholderText('Has error');
      const errorMessage = screen.getByText('This field is required');
      
      expect(input).toHaveAttribute('required');
      expect(errorMessage).toHaveClass('text-destructive');
      
      // Error message should be in the document and accessible
      expect(errorMessage).toBeInTheDocument();
    });

    it('supports screen reader announcements for helper text', () => {
      render(
        <Input 
          label="Helper Text" 
          placeholder="Has helper"
          helperText="This is helpful information"
        />
      );
      
      const helperText = screen.getByText('This is helpful information');
      
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-muted-foreground');
    });

    it('handles required field indication', () => {
      render(
        <Input 
          label="Required Field" 
          placeholder="Must fill"
          required
        />
      );
      
      const input = screen.getByPlaceholderText('Must fill');
      const requiredIndicator = screen.getByText('*');
      
      expect(input).toHaveAttribute('required');
      expect(requiredIndicator).toHaveClass('text-destructive');
      expect(requiredIndicator).toBeVisible();
    });

    it('maintains focus management with icons', async () => {
      const user = userEvent.setup();
      
      render(
        <Input 
          label="Icon Input" 
          placeholder="With icon"
          icon={<Mail data-testid="mail-icon" />}
        />
      );
      
      const input = screen.getByPlaceholderText('With icon');
      const icon = screen.getByTestId('mail-icon');
      
      expect(icon).toBeInTheDocument();
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Icon should not interfere with focus
      await user.tab();
      expect(input).not.toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Input label="First" placeholder="First input" />
          <Input label="Second" placeholder="Second input" />
          <Input label="Third" placeholder="Third input" />
        </div>
      );
      
      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const thirdInput = screen.getByPlaceholderText('Third input');
      
      // Start with first input focused
      await user.click(firstInput);
      expect(firstInput).toHaveFocus();
      
      // Tab to second input
      await user.tab();
      expect(secondInput).toHaveFocus();
      
      // Tab to third input
      await user.tab();
      expect(thirdInput).toHaveFocus();
      
      // Shift+Tab back to second
      await user.tab({ shift: true });
      expect(secondInput).toHaveFocus();
    });

    it('supports different input types', async () => {
      const user = userEvent.setup();
      
      // Test text input
      render(<Input type="text" placeholder="Text input" />);
      const textInput = screen.getByPlaceholderText('Text input');
      expect(textInput).toHaveAttribute('type', 'text');
      await user.type(textInput, 'Hello');
      expect(textInput).toHaveValue('Hello');
    });

    it('supports number input type', () => {
      render(<Input type="number" placeholder="Number input" />);
      const numberInput = screen.getByPlaceholderText('Number input');
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('supports email input type', async () => {
      const user = userEvent.setup();
      
      render(<Input type="email" placeholder="Email input" />);
      const emailInput = screen.getByPlaceholderText('Email input');
      expect(emailInput).toHaveAttribute('type', 'email');
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('handles escape key behavior', async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      
      render(
        <Input 
          label="Escape Test" 
          placeholder="Press escape"
          onBlur={onBlur}
        />
      );
      
      const input = screen.getByPlaceholderText('Press escape');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Escape key doesn't automatically blur input in all browsers
      // but we can test that the onBlur handler works when blur occurs
      await user.keyboard('{Escape}');
      fireEvent.blur(input); // Manually trigger blur to test handler
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('supports basic keyboard interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <Input 
          label="Keyboard Test" 
          placeholder="Type here"
        />
      );
      
      const input = screen.getByPlaceholderText('Type here');
      
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Type content
      await user.type(input, 'Hello');
      expect(input).toHaveValue('Hello');
      
      // Clear content
      await user.clear(input);
      expect(input).toHaveValue('');
      
      // Type new content
      await user.type(input, 'World');
      expect(input).toHaveValue('World');
    });

    it('handles disabled state with keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Input label="Before" placeholder="Before disabled" />
          <Input label="Disabled" placeholder="Disabled input" disabled />
          <Input label="After" placeholder="After disabled" />
        </div>
      );
      
      const beforeInput = screen.getByPlaceholderText('Before disabled');
      const disabledInput = screen.getByPlaceholderText('Disabled input');
      const afterInput = screen.getByPlaceholderText('After disabled');
      
      await user.click(beforeInput);
      expect(beforeInput).toHaveFocus();
      
      // Tab should skip disabled input
      await user.tab();
      expect(disabledInput).not.toHaveFocus();
      expect(afterInput).toHaveFocus();
    });
  });
});