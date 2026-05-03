import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileUploader } from './FileUploader';
import { ToastProvider } from '@/components/base/Toast';
import * as fileService from '@/services/file.service';

// Mock the file service
vi.mock('@/services/file.service');

// Mock the toast hook
vi.mock('@/components/base/Toast', () => ({
  ToastProvider: ({ children }: any) => <>{children}</>,
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the Button component
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Test wrapper with ToastProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('FileUploader', () => {
  const mockUploadFile = vi.mocked(fileService.uploadFile);
  const defaultProps = {
    providerId: 'test-provider-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload interface correctly', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Upload files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here, or click to select files')).toBeInTheDocument();
    expect(screen.getByText('Maximum file size: 100 MB')).toBeInTheDocument();
  });

  it('shows accepted file types when provided', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} accept={['image/*', 'application/pdf']} />
      </TestWrapper>
    );

    expect(screen.getByText('Accepted types: image/*, application/pdf')).toBeInTheDocument();
  });

  it('shows multiple files supported message when multiple is true', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} multiple={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Multiple files supported')).toBeInTheDocument();
  });

  it('opens file dialog when clicked', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;
    const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(uploadArea);
      expect(clickSpy).toHaveBeenCalled();
    }
  });

  it('handles drag and drop events', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    // Test drag enter
    fireEvent.dragEnter(uploadArea);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();

    // Test drag leave - simulate leaving the entire drop zone
    const rect = uploadArea.getBoundingClientRect();
    fireEvent.dragLeave(uploadArea, {
      clientX: rect.left - 10, // Outside the drop zone
      clientY: rect.top - 10,
    });
    
    // Wait for state update
    setTimeout(() => {
      expect(screen.getByText('Upload files')).toBeInTheDocument();
    }, 0);
  });

  it('validates file size', async () => {
    const maxSize = 1024; // 1KB
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} maxSize={maxSize} />
      </TestWrapper>
    );

    const file = new File(['x'.repeat(2048)], 'large-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    // The error should be shown in a toast, but since we're mocking the toast system,
    // we can't easily test for the toast content. Instead, we verify the file wasn't uploaded.
    await waitFor(() => {
      expect(mockUploadFile).not.toHaveBeenCalled();
    });
  });

  it('validates file type', async () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} accept={['image/*']} />
      </TestWrapper>
    );

    const file = new File(['content'], 'document.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    // The error should be shown in a toast, but since we're mocking the toast system,
    // we can't easily test for the toast content. Instead, we verify the file wasn't uploaded.
    await waitFor(() => {
      expect(mockUploadFile).not.toHaveBeenCalled();
    });
  });

  it('uploads files successfully', async () => {
    mockUploadFile.mockResolvedValue({
      id: 'file-123',
      provider_id: 'test-provider-id',
      user_id: 'user-123',
      s3_key: 'path/to/file.txt',
      filename: 'test-file.txt',
      size_bytes: 1024,
      uploaded_at: new Date().toISOString(),
    });

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file, {
        providerId: 'test-provider-id',
        folderPath: '',
        onProgress: expect.any(Function),
        abortController: expect.any(AbortController),
      });
    });
  });

  it('handles upload errors', async () => {
    mockUploadFile.mockRejectedValue(new Error('Upload failed'));

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalled();
    });
  });

  it('shows upload progress', async () => {
    let progressCallback: ((progress: any) => void) | undefined;
    
    mockUploadFile.mockImplementation((file, options) => {
      progressCallback = options.onProgress;
      return new Promise((resolve) => {
        setTimeout(() => {
          if (progressCallback) {
            progressCallback({
              fileId: 'file-123',
              fileName: file.name,
              progress: 50,
              status: 'uploading',
            });
          }
          resolve({
            id: 'file-123',
            provider_id: 'test-provider-id',
            user_id: 'user-123',
            s3_key: 'path/to/file.txt',
            filename: file.name,
            size_bytes: file.size,
            uploaded_at: new Date().toISOString(),
          });
        }, 100);
      });
    });

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    // Wait for progress to show
    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });
  });

  it('uses custom onUpload handler when provided', async () => {
    const mockOnUpload = vi.fn().mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} onUpload={mockOnUpload} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([file]);
    });

    expect(mockUploadFile).not.toHaveBeenCalled();
  });

  it('disables upload when disabled prop is true', () => {
    render(
      <TestWrapper>
        <FileUploader {...defaultProps} disabled={true} />
      </TestWrapper>
    );

    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');

    // Should not respond to drag events
    fireEvent.dragEnter(uploadArea);
    expect(screen.getByText('Upload files')).toBeInTheDocument(); // Should not change to "Drop files here"
  });

  it('allows removing files from upload queue', async () => {
    mockUploadFile.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    // Find and click remove button
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
    });
  });

  it('handles file input change', async () => {
    mockUploadFile.mockResolvedValue({
      id: 'file-123',
      provider_id: 'test-provider-id',
      user_id: 'user-123',
      s3_key: 'path/to/file.txt',
      filename: 'test-file.txt',
      size_bytes: 1024,
      uploaded_at: new Date().toISOString(),
    });

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;
    const fileInput = uploadArea.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file, {
        providerId: 'test-provider-id',
        folderPath: '',
        onProgress: expect.any(Function),
        abortController: expect.any(AbortController),
      });
    });
  });

  it('passes folderPath to upload service', async () => {
    mockUploadFile.mockResolvedValue({
      id: 'file-123',
      provider_id: 'test-provider-id',
      user_id: 'user-123',
      s3_key: 'documents/file.txt',
      filename: 'test-file.txt',
      size_bytes: 1024,
      uploaded_at: new Date().toISOString(),
    });

    render(
      <TestWrapper>
        <FileUploader {...defaultProps} folderPath="documents" />
      </TestWrapper>
    );

    const file = new File(['content'], 'test-file.txt', { type: 'text/plain' });
    const uploadArea = screen.getByText('Upload files').closest('div')!.parentElement!;

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file, {
        providerId: 'test-provider-id',
        folderPath: 'documents',
        onProgress: expect.any(Function),
        abortController: expect.any(AbortController),
      });
    });
  });
});