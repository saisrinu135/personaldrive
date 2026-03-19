import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormContainer } from './FormContainer';
import { FormInput } from './FormInput';

describe('FormContainer', () => {
  it('should render with title and description', () => {
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
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('should render without title and description', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <div>Form content</div>
      </FormContainer>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('should render submit button with default text', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <div>Form content</div>
      </FormContainer>
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should show loading state when loading prop is true', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit} loading={true}>
        <div>Form content</div>
      </FormContainer>
    );

    const submitButton = screen.getByRole('button', { name: 'Processing...' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit with form data when form is submitted', async () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <input name="username" defaultValue="testuser" />
        <input name="email" defaultValue="test@example.com" />
      </FormContainer>
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });
  });

  it('should prevent default form submission', () => {
    const onSubmit = vi.fn();
    const preventDefault = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <input name="test" defaultValue="value" />
      </FormContainer>
    );

    const form = screen.getByRole('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    submitEvent.preventDefault = preventDefault;
    
    fireEvent(form, submitEvent);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit} className="custom-form-class">
        <div>Form content</div>
      </FormContainer>
    );

    // The className is applied to the Card component
    const card = screen.getByRole('form').closest('.custom-form-class');
    expect(card).toBeInTheDocument();
  });

  it('should handle form submission with FormInput components', async () => {
    const onSubmit = vi.fn();
    
    const TestForm = () => {
      const [username, setUsername] = React.useState('');
      const [email, setEmail] = React.useState('');
      
      return (
        <FormContainer onSubmit={onSubmit}>
          <FormInput
            name="username"
            type="text"
            label="Username"
            value={username}
            onChange={setUsername}
          />
          <FormInput
            name="email"
            type="email"
            label="Email"
            value={email}
            onChange={setEmail}
          />
        </FormContainer>
      );
    };

    render(<TestForm />);

    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });
  });

  it('should not submit when loading is true', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit} loading={true}>
        <input name="test" defaultValue="value" />
      </FormContainer>
    );

    const submitButton = screen.getByRole('button', { name: 'Processing...' });
    fireEvent.click(submitButton);

    // Button should be disabled, so click shouldn't trigger submission
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should have proper form structure and accessibility', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer
        onSubmit={onSubmit}
        title="Test Form"
        description="Form description"
      >
        <input name="test" aria-label="Test input" />
      </FormContainer>
    );

    // Check form structure
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    // Check heading hierarchy
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Test Form');

    // Check submit button
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should handle empty form submission', async () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <div>No form inputs</div>
      </FormContainer>
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({});
    });
  });

  it('should handle form submission with various input types', async () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <input name="text" type="text" defaultValue="text value" />
        <input name="email" type="email" defaultValue="test@example.com" />
        <input name="number" type="number" defaultValue="123" />
        <input name="checkbox" type="checkbox" defaultChecked />
        <select name="select" defaultValue="option2">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
        <textarea name="textarea" defaultValue="textarea content" />
      </FormContainer>
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        text: 'text value',
        email: 'test@example.com',
        number: '123',
        checkbox: 'on',
        select: 'option2',
        textarea: 'textarea content',
      });
    });
  });

  it('should maintain form spacing and layout classes', () => {
    const onSubmit = vi.fn();
    
    render(
      <FormContainer onSubmit={onSubmit}>
        <div>Form content</div>
      </FormContainer>
    );

    const form = screen.getByRole('form');
    expect(form).toHaveClass('space-y-6');

    // Check for content wrapper
    const contentWrapper = form.querySelector('.space-y-4');
    expect(contentWrapper).toBeInTheDocument();
  });
});