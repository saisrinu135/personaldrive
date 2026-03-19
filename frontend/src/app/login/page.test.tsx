import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useRouter } from 'next/navigation';
import LoginPage from './page';
import { useAuth } from '@/contexts/AuthContext';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock validation hooks
vi.mock('@/hooks/useValidation', () => ({
  useFieldValidation: vi.fn(() => ({
    value: '',
    validation: { isValid: true, errors: [] },
    touched: false,
    setValue: vi.fn(),
    validateValue: vi.fn(),
  })),
  useAsyncValidation: vi.fn(() => ({
    isValidating: false,
    validation: { isValid: true, errors: [] },
  })),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

const mockPush = vi.fn();
const mockLogin = vi.fn();
const mockClearError = vi.fn();

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('LoginPage', () => {
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
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });
  });

  it('renders login form with email and password fields', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('calls login function with correct credentials', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('displays authentication error', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid credentials',
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });

    render(<LoginPage />);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User', created_at: '', updated_at: '' },
      token: 'token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });

    render(<LoginPage />);
    
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
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });

    render(<LoginPage />);
    
    // Check for the loading spinner div with the specific classes
    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();
  });

  it('clears errors when form data changes', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Some error',
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: mockClearError,
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(mockClearError).toHaveBeenCalled();
  });

  it('renders navigation links', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});