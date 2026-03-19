import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileList } from './FileList';
import { FileItem } from '@/types/file.types';
import { ToastProvider } from '@/components/base/Toast';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the Button component
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, loading, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled || loading} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

// Mock the Card component
vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock the file service
vi.mock('@/services/file.service', () => ({
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'test-image.jpg',
    size: 1024000,
    type: 'image/jpeg',
    uploadDate: new Date('2024-01-15T10:30:00Z'),
    thumbnail: 'https://example.com/thumb1.jpg',
  },
  {
    id: '2',
    name: 'document.pdf',
    size: 2048000,
    type: 'application/pdf',
    uploadDate: new Date('2024-01-14T14:20:00Z'),
  },
];

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('FileList Component', () => {
  it('renders file list with file names', () => {
    renderWithToast(
      <FileList files={mockFiles} providerId="test-provider" />
    );

    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    renderWithToast(
      <FileList 
        files={[]} 
        providerId="test-provider" 
        loading={true}
      />
    );

    // Should show loading animation class
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays empty state when no files', () => {
    renderWithToast(
      <FileList 
        files={[]} 
        providerId="test-provider" 
        emptyMessage="No files found"
      />
    );

    expect(screen.getByText('No files found')).toBeInTheDocument();
    expect(screen.getByText('Upload some files to get started')).toBeInTheDocument();
  });

  it('displays custom empty message', () => {
    const customMessage = 'Your custom empty message';
    renderWithToast(
      <FileList 
        files={[]} 
        providerId="test-provider" 
        emptyMessage={customMessage}
      />
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders in list view mode', () => {
    renderWithToast(
      <FileList 
        files={mockFiles} 
        providerId="test-provider" 
        viewMode="list"
      />
    );

    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('provides alt text for thumbnail images', () => {
    renderWithToast(
      <FileList files={mockFiles} providerId="test-provider" />
    );

    const thumbnailImage = screen.getByAltText('test-image.jpg');
    expect(thumbnailImage).toBeInTheDocument();
    expect(thumbnailImage).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
  });

  it('provides title attributes for file names', () => {
    renderWithToast(
      <FileList files={mockFiles} providerId="test-provider" />
    );

    const fileName = screen.getByText('test-image.jpg');
    expect(fileName).toHaveAttribute('title', 'test-image.jpg');
  });
});