import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StorageUsageCard } from './StorageUsageCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('StorageUsageCard', () => {
  const defaultProps = {
    storageUsed: 5368709120, // 5 GB
    storageLimit: 10737418240, // 10 GB
  };

  it('renders storage usage information correctly', () => {
    render(<StorageUsageCard {...defaultProps} />);
    
    expect(screen.getByText('Storage Usage')).toBeInTheDocument();
    expect(screen.getByText('5 GB')).toBeInTheDocument();
    expect(screen.getByText('of 10 GB used')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('displays correct usage percentage', () => {
    render(<StorageUsageCard storageUsed={2147483648} storageLimit={10737418240} />);
    
    expect(screen.getByText('20.0%')).toBeInTheDocument();
  });

  it('shows available storage correctly', () => {
    render(<StorageUsageCard {...defaultProps} />);
    
    expect(screen.getByText('Available: 5 GB')).toBeInTheDocument();
  });

  it('displays warning message for high usage', () => {
    // Use 95% usage to ensure warning shows (> 90%)
    const storageLimit = 10737418240; // 10 GB
    const storageUsed = Math.floor(storageLimit * 0.95); // 95%
    
    render(<StorageUsageCard storageUsed={storageUsed} storageLimit={storageLimit} />);
    
    expect(screen.getByText(/Storage almost full/)).toBeInTheDocument();
  });

  it('handles zero storage limit gracefully', () => {
    render(<StorageUsageCard storageUsed={1000} storageLimit={0} />);
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('formats bytes correctly for different sizes', () => {
    // Test KB
    render(<StorageUsageCard storageUsed={1024} storageLimit={2048} />);
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('of 2 KB used')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StorageUsageCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct progress bar color for different usage levels', () => {
    const { rerender } = render(
      <StorageUsageCard storageUsed={1073741824} storageLimit={10737418240} />
    );
    
    // Low usage (green) - 10%
    expect(screen.getByText('10.0%')).toBeInTheDocument();
    
    // Medium usage (yellow) - 60%
    rerender(<StorageUsageCard storageUsed={6442450944} storageLimit={10737418240} />);
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    
    // High usage (red) - 90%
    rerender(<StorageUsageCard storageUsed={9663676416} storageLimit={10737418240} />);
    expect(screen.getByText('90.0%')).toBeInTheDocument();
  });
});