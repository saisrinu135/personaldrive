import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import RegisterPage from './page';
import { useAuth } from '@/contexts/AuthContext';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockPush = vi.fn();
const mockRegister = vi.fn();
const mockClearError = vi.fn();

const mockUseRouter = useRouter as any;
const mockUseAuth = useAuth as any;

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterPage />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('validates name length requirements', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'A'); // Too short
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password strength requirements', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'weak'); // Too weak
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });
  });

  it('validates password confirmation matching', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'StrongPass123');
    await user.type(confirmPasswordInput, 'DifferentPass123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    
    render(<RegisterPage />);
    
    // Fill in valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@example.com', 'StrongPass123');
    });
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    render(<RegisterPage />);
    
    // Fill in valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('displays authentication error from context', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Email already exists',
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
    
    render(<RegisterPage />);
    
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      token: 'token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
    
    render(<RegisterPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
    
    render(<RegisterPage />);
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('clears errors when form data changes', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Registration failed',
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
    
    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'John');
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('contains link to login page', () => {
    render(<RegisterPage />);
    
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('contains links to terms and privacy policy', () => {
    render(<RegisterPage />);
    
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'StrongPass123');
    
    // Password strength indicator should be visible
    expect(screen.getByText('Password strength:')).toBeInTheDocument();
  });
});