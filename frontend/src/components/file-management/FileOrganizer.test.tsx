import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileOrganizer } from './FileOrganizer';
import { FileItem, FolderItem } from '@/types/file.types';
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

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'document.pdf',
    size: 1024000,
    type: 'application/pdf',
    uploadDate: new Date('2023-01-01'),
    folderPath: '',
  },
  {
    id: '2',
    name: 'image.jpg',
    size: 512000,
    type: 'image/jpeg',
    uploadDate: new Date('2023-01-02'),
    folderPath: 'images',
  },
];

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
  files: mockFiles,
  folders: mockFolders,
  currentPath: '',
  providerId: 'test-provider',
  onRefresh: jest.fn(),
};

describe('FileOrganizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders files and folders for organization', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    expect(screen.getByText('Files (drag to organize)')).toBeInTheDocument();
    expect(screen.getByText('Folders (drop files here)')).toBeInTheDocument();
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  it('shows root folder option when not in root directory', () => {
    render(<FileOrganizer {...defaultProps} currentPath="subfolder" />);
    
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('does not show root folder option when in root directory', () => {
    render(<FileOrganizer {...defaultProps} currentPath="" />);
    
    expect(screen.queryByText('Root')).not.toBeInTheDocument();
  });

  it('makes files draggable', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    expect(fileElement).toHaveAttribute('draggable', 'true');
  });

  it('handles drag start event', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    
    // Create a mock dataTransfer object
    const mockDataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
    };
    
    const dragEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    
    fireEvent(fileElement!, dragEvent);
    
    expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', '1');
  });

  it('shows empty state when no files or folders exist', () => {
    render(<FileOrganizer {...defaultProps} files={[]} folders={[]} />);
    
    expect(screen.getByText('No files or folders to organize')).toBeInTheDocument();
  });

  it('formats file sizes correctly', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
    expect(screen.getByText('500.0 KB')).toBeInTheDocument();
  });

  it('displays folder file counts', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    expect(screen.getByText('5 files')).toBeInTheDocument();
    expect(screen.getByText('10 files')).toBeInTheDocument();
  });

  it('handles file move operation', async () => {
    const mockOnFileMove = jest.fn().mockResolvedValue(undefined);
    const mockAddToast = jest.fn();
    
    // Mock toast hook
    jest.mocked(require('@/components/base/Toast').useToast).mockReturnValue({
      addToast: mockAddToast,
    });
    
    render(<FileOrganizer {...defaultProps} onFileMove={mockOnFileMove} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    const folderElement = screen.getByText('Documents').closest('div');
    
    // Simulate drag and drop
    const mockDataTransfer = {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue('1'),
      effectAllowed: '',
      dropEffect: '',
    };
    
    // Start drag
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(fileElement!, dragStartEvent);
    
    // Drop on folder
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(folderElement!, dropEvent);
    
    await waitFor(() => {
      expect(mockOnFileMove).toHaveBeenCalledWith('1', 'documents');
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        title: 'File moved',
        message: '"document.pdf" moved to documents',
      });
    });
  });

  it('handles file move error', async () => {
    const mockOnFileMove = jest.fn().mockRejectedValue(new Error('Move failed'));
    const mockAddToast = jest.fn();
    
    // Mock toast hook
    jest.mocked(require('@/components/base/Toast').useToast).mockReturnValue({
      addToast: mockAddToast,
    });
    
    render(<FileOrganizer {...defaultProps} onFileMove={mockOnFileMove} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    const folderElement = screen.getByText('Documents').closest('div');
    
    // Simulate drag and drop
    const mockDataTransfer = {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue('1'),
      effectAllowed: '',
      dropEffect: '',
    };
    
    // Start drag
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(fileElement!, dragStartEvent);
    
    // Drop on folder
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(folderElement!, dropEvent);
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'error',
        title: 'Move failed',
        message: 'Move failed',
      });
    });
  });

  it('prevents moving file to same folder', () => {
    const mockOnFileMove = jest.fn();
    
    render(<FileOrganizer {...defaultProps} onFileMove={mockOnFileMove} />);
    
    const fileElement = screen.getByText('image.jpg').closest('[draggable]');
    const folderElement = screen.getByText('Images').closest('div');
    
    // Simulate drag and drop (image.jpg is already in images folder)
    const mockDataTransfer = {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue('2'),
      effectAllowed: '',
      dropEffect: '',
    };
    
    // Start drag
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(fileElement!, dragStartEvent);
    
    // Drop on same folder
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(folderElement!, dropEvent);
    
    // Should not call move function
    expect(mockOnFileMove).not.toHaveBeenCalled();
  });

  it('uses default move service when no custom handler provided', async () => {
    mockFileService.moveFile.mockResolvedValue();
    const mockAddToast = jest.fn();
    
    // Mock toast hook
    jest.mocked(require('@/components/base/Toast').useToast).mockReturnValue({
      addToast: mockAddToast,
    });
    
    render(<FileOrganizer {...defaultProps} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    const folderElement = screen.getByText('Documents').closest('div');
    
    // Simulate drag and drop
    const mockDataTransfer = {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue('1'),
      effectAllowed: '',
      dropEffect: '',
    };
    
    // Start drag
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(fileElement!, dragStartEvent);
    
    // Drop on folder
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });
    fireEvent(folderElement!, dropEvent);
    
    await waitFor(() => {
      expect(mockFileService.moveFile).toHaveBeenCalledWith('1', 'documents', 'test-provider');
    });
  });

  it('shows drop target visual feedback', () => {
    render(<FileOrganizer {...defaultProps} />);
    
    const fileElement = screen.getByText('document.pdf').closest('[draggable]');
    const folderElement = screen.getByText('Documents').closest('div');
    
    // Start drag
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: { setData: jest.fn(), effectAllowed: '' },
    });
    fireEvent(fileElement!, dragStartEvent);
    
    // Drag enter folder
    const dragEnterEvent = new Event('dragenter', { bubbles: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', {
      value: { effectAllowed: '' },
    });
    fireEvent(folderElement!, dragEnterEvent);
    
    // Should show drop target feedback
    expect(screen.getByText('Drop file here')).toBeInTheDocument();
  });
});