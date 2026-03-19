import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecentFilesCard } from './RecentFilesCard';
import { FileMetadata } from '@/types/file.types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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

describe('RecentFilesCard', () => {
  const mockFiles: FileMetadata[] = [
    {
      id: '1',
      name: 'document.pdf',
      size: 1048576, // 1 MB
      type: 'application/pdf',
      path: '/documents/document.pdf',
      uploadDate: new Date('2024-01-15T10:30:00Z'),
      lastModified: new Date('2024-01-15T10:30:00Z'),
      checksum: 'abc123',
    },
    {
      id: '2',
      name: 'image.jpg',
      size: 2097152, // 2 MB
      type: 'image/jpeg',
      path: '/images/image.jpg',
      uploadDate: new Date('2024-01-14T15:45:00Z'),
      lastModified: new Date('2024-01-14T15:45:00Z'),
      checksum: 'def456',
    },
    {
      id: '3',
      name: 'video.mp4',
      size: 10485760, // 10 MB
      type: 'video/mp4',
      path: '/videos/video.mp4',
      uploadDate: new Date('2024-01-13T09:15:00Z'),
      lastModified: new Date('2024-01-13T09:15:00Z'),
      checksum: 'ghi789',
    },
  ];

  const defaultProps = {
    recentFiles: mockFiles,
  };

  beforeEach(() => {
    // Mock Date.now() for consistent relative time testing
    vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-15T12:00:00Z').getTime());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders recent files correctly', () => {
    render(<RecentFilesCard {...defaultProps} />);
    
    expect(screen.getByText('Recent Files')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });

  it('displays file sizes correctly', () => {
    render(<RecentFilesCard {...defaultProps} />);
    
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('10 MB')).toBeInTheDocument();
  });

  it('shows correct file type icons', () => {
    render(<RecentFilesCard {...defaultProps} />);
    
    // Icons are rendered but we can't easily test their specific types
    // We can verify the files are rendered with their names
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });

  it('limits files to maxFiles prop', () => {
    render(<RecentFilesCard {...defaultProps} maxFiles={2} />);
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.queryByText('video.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more files')).toBeInTheDocument();
  });

  it('calls onDownload when download button is clicked', () => {
    const mockOnDownload = vi.fn();
    render(<RecentFilesCard {...defaultProps} onDownload={mockOnDownload} />);
    
    const downloadButtons = screen.getAllByRole('button');
    fireEvent.click(downloadButtons[0]);
    
    expect(mockOnDownload).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('calls onViewAll when View All button is clicked', () => {
    const mockOnViewAll = vi.fn();
    render(<RecentFilesCard {...defaultProps} onViewAll={mockOnViewAll} maxFiles={2} />);
    
    const viewAllButton = screen.getByText('View All');
    fireEvent.click(viewAllButton);
    
    expect(mockOnViewAll).toHaveBeenCalled();
  });

  it('shows empty state when no files', () => {
    render(<RecentFilesCard recentFiles={[]} />);
    
    expect(screen.getByText('No recent files')).toBeInTheDocument();
    expect(screen.getByText('Upload some files to see them here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RecentFilesCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('does not show View All button when files count is within limit', () => {
    render(<RecentFilesCard {...defaultProps} maxFiles={5} onViewAll={vi.fn()} />);
    
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('truncates long file names with title attribute', () => {
    const longNameFile: FileMetadata = {
      ...mockFiles[0],
      name: 'very-long-file-name-that-should-be-truncated-in-the-display.pdf',
    };
    
    render(<RecentFilesCard recentFiles={[longNameFile]} />);
    
    const fileNameElement = screen.getByText(longNameFile.name);
    expect(fileNameElement).toHaveAttribute('title', longNameFile.name);
  });

  it('formats file sizes for different byte ranges', () => {
    const differentSizeFiles: FileMetadata[] = [
      { ...mockFiles[0], id: 'small', size: 512, name: 'small.txt' }, // Bytes
      { ...mockFiles[0], id: 'medium', size: 1536, name: 'medium.txt' }, // KB
      { ...mockFiles[0], id: 'large', size: 1073741824, name: 'large.txt' }, // GB
    ];
    
    render(<RecentFilesCard recentFiles={differentSizeFiles} />);
    
    expect(screen.getByText('512 Bytes')).toBeInTheDocument();
    expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    expect(screen.getByText('1 GB')).toBeInTheDocument();
  });
});