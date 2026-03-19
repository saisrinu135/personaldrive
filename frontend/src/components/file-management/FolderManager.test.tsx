import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderManager } from './FolderManager';
import { FolderItem } from '@/types/file.types';
import * as fileService from '@/services/file.service';

// Mock the file service
jest.mock('@/services/file.service');
const mockFileService = fileService as jest.Mocked<typeof fileService>;

// Mock toast
jest.mock('@/components/base/Toast', () => ({
  useToast: () => ({
    addToast: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockFolders: FolderItem[] = [
  {
    id: '1',
    name: 'Documents',
    path: 'documents',
    createdDate: new Date('2023-01-01'),
    modifiedDate: new Date('2023-01-02'),
    fileCount: 5,
    totalSize: 1024000,
  },
  {
    id: '2',
    name: 'Images',
    path: 'images',
    createdDate: new Date('2023-01-03'),
    modifiedDate: new Date('2023-01-04'),
    fileCount: 10,
    totalSize: 5120000,
  },
];

const defaultProps = {
  folders: mockFolders,
  currentPath: '',
  providerId: 'test-provider',
  onFolderClick: jest.fn(),
  onRefresh: jest.fn(),
};

describe('FolderManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders folder list correctly', () => {
    render(<FolderManager {...defaultProps} />);
    
    expect(screen.getByText('Folders')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('5 files')).toBeInTheDocument();
    expect(screen.getByText('10 files')).toBeInTheDocument();
  });

  it('shows new folder button', () => {
    render(<FolderManager {...defaultProps} />);
    
    expect(screen.getByText('New Folder')).toBeInTheDocument();
  });

  it('opens folder creation form when new folder button is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderManager {...defaultProps} />);
    
    await user.click(screen.getByText('New Folder'));
    
    expect(screen.getByPlaceholderText('Enter folder name')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('creates a new folder when form is submitted', async () => {
    const user = userEvent.setup();
    mockFileService.createFolder.mockResolvedValue();
    
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form
    await user.click(screen.getByText('New Folder'));
    
    // Enter folder name
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, 'New Folder');
    
    // Submit form
    await user.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(mockFileService.createFolder).toHaveBeenCalledWith('', 'New Folder', 'test-provider');
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });
  });

  it('cancels folder creation when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form
    await user.click(screen.getByText('New Folder'));
    
    // Enter some text
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, 'Test');
    
    // Cancel
    await user.click(screen.getByText('Cancel'));
    
    // Form should be hidden
    expect(screen.queryByPlaceholderText('Enter folder name')).not.toBeInTheDocument();
  });

  it('handles folder click navigation', async () => {
    const user = userEvent.setup();
    render(<FolderManager {...defaultProps} />);
    
    await user.click(screen.getByText('Documents'));
    
    expect(defaultProps.onFolderClick).toHaveBeenCalledWith('documents');
  });

  it('shows empty state when no folders exist', () => {
    render(<FolderManager {...defaultProps} folders={[]} />);
    
    expect(screen.getByText('No folders in this location')).toBeInTheDocument();
  });

  it('validates folder name input', async () => {
    const user = userEvent.setup();
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form
    await user.click(screen.getByText('New Folder'));
    
    // Try to create with empty name
    const createButton = screen.getByText('Create');
    expect(createButton).toBeDisabled();
    
    // Enter whitespace only
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, '   ');
    
    // Button should still be disabled
    expect(createButton).toBeDisabled();
  });

  it('handles folder creation error', async () => {
    const user = userEvent.setup();
    const mockAddToast = jest.fn();
    
    // Mock toast hook
    jest.mocked(require('@/components/base/Toast').useToast).mockReturnValue({
      addToast: mockAddToast,
    });
    
    mockFileService.createFolder.mockRejectedValue(new Error('Creation failed'));
    
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form and create folder
    await user.click(screen.getByText('New Folder'));
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, 'Test Folder');
    await user.click(screen.getByText('Create'));
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to create folder',
        message: 'Creation failed',
      });
    });
  });

  it('supports keyboard navigation in folder creation', async () => {
    const user = userEvent.setup();
    mockFileService.createFolder.mockResolvedValue();
    
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form
    await user.click(screen.getByText('New Folder'));
    
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, 'Keyboard Folder');
    
    // Submit with Enter key
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockFileService.createFolder).toHaveBeenCalledWith('', 'Keyboard Folder', 'test-provider');
    });
  });

  it('cancels folder creation with Escape key', async () => {
    const user = userEvent.setup();
    render(<FolderManager {...defaultProps} />);
    
    // Open creation form
    await user.click(screen.getByText('New Folder'));
    
    const input = screen.getByPlaceholderText('Enter folder name');
    await user.type(input, 'Test');
    
    // Cancel with Escape key
    await user.keyboard('{Escape}');
    
    // Form should be hidden
    expect(screen.queryByPlaceholderText('Enter folder name')).not.toBeInTheDocument();
  });

  it('formats file count correctly', () => {
    const foldersWithDifferentCounts: FolderItem[] = [
      { ...mockFolders[0], fileCount: 0 },
      { ...mockFolders[1], fileCount: 1 },
    ];
    
    render(<FolderManager {...defaultProps} folders={foldersWithDifferentCounts} />);
    
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('1 file')).toBeInTheDocument();
  });

  it('displays folder sizes when available', () => {
    render(<FolderManager {...defaultProps} />);
    
    // Should show formatted sizes for folders with content
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
  });
});