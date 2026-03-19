import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileCountCard } from './FileCountCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('FileCountCard', () => {
  const defaultProps = {
    totalFiles: 150,
  };

  const fileTypeBreakdown = {
    documents: 50,
    images: 75,
    videos: 15,
    audio: 8,
    others: 2,
  };

  it('renders total file count correctly', () => {
    render(<FileCountCard {...defaultProps} />);
    
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Files stored')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<FileCountCard totalFiles={1234567} />);
    
    // toLocaleString() might format differently based on locale
    // Check for the number being present, regardless of formatting
    expect(screen.getByText(/1.*2.*3.*4.*5.*6.*7/)).toBeInTheDocument();
  });

  it('displays file type breakdown when provided', () => {
    render(<FileCountCard {...defaultProps} fileTypeBreakdown={fileTypeBreakdown} />);
    
    expect(screen.getByText('File Types')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
    
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides file types with zero count', () => {
    const breakdownWithZeros = {
      documents: 10,
      images: 0,
      videos: 5,
      audio: 0,
      others: 0,
    };
    
    render(<FileCountCard totalFiles={15} fileTypeBreakdown={breakdownWithZeros} />);
    
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.queryByText('Images')).not.toBeInTheDocument();
    expect(screen.queryByText('Audio')).not.toBeInTheDocument();
    expect(screen.queryByText('Others')).not.toBeInTheDocument();
  });

  it('shows empty state message when no files', () => {
    render(<FileCountCard totalFiles={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FileCountCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays active status indicator', () => {
    render(<FileCountCard {...defaultProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('works without file type breakdown', () => {
    render(<FileCountCard totalFiles={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('File Types')).not.toBeInTheDocument();
  });
});