/**
 * Property-based tests for Landing Page authentication state
 * **Feature: frontend-pages-and-navigation, Property 7: Landing Page Authentication State**
 * **Validates: Requirements 3.6**
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { vi, afterEach } from 'vitest';
import AuthContext from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth-state.types';
import { User } from '@/types/auth.types';
import Home from './page';
import fc from 'fast-check';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Cloud: () => <span>Cloud</span>,
  Shield: () => <span>Shield</span>,
  Zap: () => <span>Zap</span>,
  Users: () => <span>Users</span>,
  ArrowRight: () => <span>ArrowRight</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Upload: () => <span>Upload</span>,
  Download: () => <span>Download</span>,
  FolderOpen: () => <span>FolderOpen</span>,
  Smartphone: () => <span>Smartphone</span>,
  Monitor: () => <span>Monitor</span>,
  Tablet: () => <span>Tablet</span>,
}));

// Simple user generator with valid names
const userArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 3, maxLength: 50 }).filter(name => /^[a-zA-Z\s]+$/.test(name.trim())),
  email: fc.emailAddress(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  storageUsed: fc.nat(),
  storageLimit: fc.nat(),
  avatar: fc.option(fc.webUrl(), { nil: undefined }),
});

// Test wrapper component
const TestWrapper: React.FC<{ authContext: AuthContextType; children: React.ReactNode }> = ({
  authContext,
  children,
}) => (
  <AuthContext.Provider value={authContext}>
    {children}
  </AuthContext.Provider>
);

describe('Landing Page Authentication State Properties', () => {
  /**
   * Property 7: Landing Page Authentication State
   * For any authenticated user visiting the landing page, 
   * a dashboard link should be provided in addition to standard navigation.
   */
  it('should provide dashboard link for authenticated users', () => {
    fc.assert(
      fc.property(userArbitrary, (user) => {
        // Create authenticated context
        const authContext = {
          user,
          token: 'valid-token',
          refreshToken: 'valid-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn(),
          refreshAuth: vi.fn(),
          clearError: vi.fn(),
        };

        render(
          <TestWrapper authContext={authContext}>
            <Home />
          </TestWrapper>
        );

        // Should have dashboard link for authenticated users
        const dashboardLinks = screen.getAllByRole('link', { name: /go to dashboard/i });
        expect(dashboardLinks.length).toBeGreaterThan(0);
        expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');

        // Should display user greeting
        expect(screen.getByText('Welcome back,')).toBeInTheDocument();
        expect(screen.getByText(user.name)).toBeInTheDocument();

        // Should NOT have login/register buttons in hero section
        expect(screen.queryByRole('link', { name: /get started free/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
      }),
      { numRuns: 10 }
    );
  }, 15000);

  it('should provide login and register links for unauthenticated users', () => {
    const authContext = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: vi.fn(),
    };

    render(
      <TestWrapper authContext={authContext}>
        <Home />
      </TestWrapper>
    );

    // Should have login and register links for unauthenticated users
    const registerLinks = screen.getAllByRole('link', { name: /get started free/i });
    const loginLinks = screen.getAllByRole('link', { name: /sign in/i });
    
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(loginLinks.length).toBeGreaterThan(0);
    
    // Check that at least one of each link has correct href
    expect(registerLinks.some(link => link.getAttribute('href') === '/register')).toBe(true);
    expect(loginLinks.some(link => link.getAttribute('href') === '/login')).toBe(true);

    // Should NOT have dashboard link
    expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument();

    // Should NOT display user greeting
    expect(screen.queryByText('Welcome back,')).not.toBeInTheDocument();
  });

  it('should handle loading state gracefully', () => {
    const authContext = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearError: vi.fn(),
    };

    render(
      <TestWrapper authContext={authContext}>
        <Home />
      </TestWrapper>
    );

    // During loading, should not show any auth-specific buttons in hero section
    expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument();
    
    // Hero section should not show login/register buttons during loading
    const heroButtons = screen.queryAllByRole('link', { name: /get started free/i });
    expect(heroButtons.length).toBe(0);

    // Should still show the main content
    expect(screen.getByText(/your personal/i)).toBeInTheDocument();
    expect(screen.getByText(/cloud storage/i)).toBeInTheDocument();
  });

  it('should display consistent branding and content regardless of auth state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(userArbitrary, { nil: null }),
        (isAuthenticated, user) => {
          const authContext = {
            user: isAuthenticated ? user : null,
            token: isAuthenticated ? 'valid-token' : null,
            refreshToken: isAuthenticated ? 'valid-refresh-token' : null,
            isAuthenticated,
            isLoading: false,
            error: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            refreshAuth: vi.fn(),
            clearError: vi.fn(),
          };

          render(
            <TestWrapper authContext={authContext}>
              <Home />
            </TestWrapper>
          );

          // Core content should always be present
          expect(screen.getByText(/your personal/i)).toBeInTheDocument();
          expect(screen.getByText(/cloud storage/i)).toBeInTheDocument();
          expect(screen.getByText(/store, organize, and access your files/i)).toBeInTheDocument();

          // Features section should always be present
          expect(screen.getByText(/secure cloud storage/i)).toBeInTheDocument();
          expect(screen.getByText(/easy file upload/i)).toBeInTheDocument();
          expect(screen.getByText(/smart organization/i)).toBeInTheDocument();

          // Footer should always be present
          expect(screen.getByText(/cloudstore/i)).toBeInTheDocument();
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);

  it('should provide accessible navigation elements', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(userArbitrary, { nil: null }),
        (isAuthenticated, user) => {
          const authContext = {
            user: isAuthenticated ? user : null,
            token: isAuthenticated ? 'valid-token' : null,
            refreshToken: isAuthenticated ? 'valid-refresh-token' : null,
            isAuthenticated,
            isLoading: false,
            error: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            refreshAuth: vi.fn(),
            clearError: vi.fn(),
          };

          render(
            <TestWrapper authContext={authContext}>
              <Home />
            </TestWrapper>
          );

          // All links should be accessible
          const links = screen.getAllByRole('link');
          links.forEach(link => {
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href');
          });

          // Main headings should be present for screen readers
          const headings = screen.getAllByRole('heading', { level: 1 });
          expect(headings.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);
});