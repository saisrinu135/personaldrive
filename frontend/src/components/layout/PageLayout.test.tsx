import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PageLayout from './PageLayout';
import { BreadcrumbItem } from '@/types/component.types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the Button component
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock the Breadcrumb component
vi.mock('@/components/navigation', () => ({
  Breadcrumb: ({ items }: any) => (
    <nav role="navigation" aria-label="Breadcrumb navigation">
      {items.map((item: any, index: number) => (
        <span key={index}>{item.label}</span>
      ))}
    </nav>
  ),
}));

describe('PageLayout', () => {
  const defaultProps = {
    title: 'Test Page',
    children: <div>Page content</div>,
  };

  it('renders page title correctly', () => {
    render(<PageLayout {...defaultProps} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Page');
  });

  it('renders page description when provided', () => {
    render(
      <PageLayout 
        {...defaultProps} 
        description="This is a test page description" 
      />
    );
    
    expect(screen.getByText('This is a test page description')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Current Page' },
    ];

    render(
      <PageLayout 
        {...defaultProps} 
        breadcrumbs={breadcrumbs} 
      />
    );
    
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('renders action buttons when provided', () => {
    const actions = (
      <button type="button">Test Action</button>
    );

    render(
      <PageLayout 
        {...defaultProps} 
        actions={actions} 
      />
    );
    
    expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
  });

  it('renders sidebar when provided', () => {
    const sidebar = <nav>Sidebar content</nav>;

    render(
      <PageLayout 
        {...defaultProps} 
        sidebar={sidebar} 
      />
    );
    
    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
  });

  it('shows mobile sidebar toggle when sidebar is provided', () => {
    const sidebar = <nav>Sidebar content</nav>;

    render(
      <PageLayout 
        {...defaultProps} 
        sidebar={sidebar} 
      />
    );
    
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
  });

  it('renders main content correctly', () => {
    render(<PageLayout {...defaultProps} />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('handles mobile sidebar toggle', () => {
    const sidebar = <nav>Sidebar content</nav>;

    render(
      <PageLayout 
        {...defaultProps} 
        sidebar={sidebar} 
      />
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);
    
    // Should show close button in mobile sidebar
    expect(screen.getByRole('button', { name: /close sidebar/i })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const sidebar = <nav>Sidebar content</nav>;

    render(
      <PageLayout 
        {...defaultProps} 
        sidebar={sidebar} 
      />
    );
    
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content');
    expect(screen.getByLabelText('Sidebar navigation')).toBeInTheDocument();
  });

  it('applies responsive classes correctly', () => {
    const sidebar = <nav>Sidebar content</nav>;

    render(
      <PageLayout 
        {...defaultProps} 
        sidebar={sidebar} 
      />
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(toggleButton).toHaveClass('lg:hidden');
  });
});