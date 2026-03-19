import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardExample } from './DashboardExample';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

// Mock Button component
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock Card components
vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('DashboardExample', () => {
  it('renders all dashboard components', () => {
    render(<DashboardExample />);
    
    // Check main title
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your cloud storage account')).toBeInTheDocument();
    
    // Check component titles
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('Recent Files')).toBeInTheDocument();
    expect(screen.getByText('Storage Distribution')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('displays sample data correctly', () => {
    render(<DashboardExample />);
    
    // Check for sample files
    expect(screen.getByText('Project_Proposal.pdf')).toBeInTheDocument();
    expect(screen.getByText('vacation_photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('presentation.pptx')).toBeInTheDocument();
    
    // Check for file counts
    expect(screen.getByText('110')).toBeInTheDocument(); // Total files
    
    // Check for quick actions
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('New Folder')).toBeInTheDocument();
    expect(screen.getByText('Search Files')).toBeInTheDocument();
    expect(screen.getByText('Manage Storage')).toBeInTheDocument();
  });

  it('shows component documentation', () => {
    render(<DashboardExample />);
    
    expect(screen.getByText('Dashboard Components')).toBeInTheDocument();
    expect(screen.getByText(/StorageUsageCard/)).toBeInTheDocument();
    expect(screen.getByText(/FileCountCard/)).toBeInTheDocument();
    expect(screen.getByText(/RecentFilesCard/)).toBeInTheDocument();
    expect(screen.getByText(/StorageDistributionChart/)).toBeInTheDocument();
    expect(screen.getByText(/QuickActionsCard/)).toBeInTheDocument();
  });

  it('renders responsive grid layout', () => {
    const { container } = render(<DashboardExample />);
    
    // Check for grid classes
    expect(container.querySelector('.grid')).toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
    expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
  });
});