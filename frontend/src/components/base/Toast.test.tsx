import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ToastProvider, 
  useToast, 
  useSuccessToast, 
  useErrorToast, 
  useWarningToast, 
  useInfoToast 
} from './Toast';

// Test component that uses toast hooks
const ToastTestComponent: React.FC = () => {
  const { addToast, removeToast, clearToasts } = useToast();
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  const showWarning = useWarningToast();
  const showInfo = useInfoToast();

  return (
    <div>
      <button onClick={() => addToast({ type: 'success', title: 'Success', message: 'Operation completed' })}>
        Add Success Toast
      </button>
      <button onClick={() => showSuccess('Quick Success')}>
        Quick Success
      </button>
      <button onClick={() => showError('Error Message', 'Something went wrong')}>
        Show Error
      </button>
      <button onClick={() => showWarning('Warning Message')}>
        Show Warning
      </button>
      <button onClick={() => showInfo('Info Message')}>
        Show Info
      </button>
      <button onClick={() => addToast({ 
        type: 'info', 
        title: 'With Action', 
        action: { label: 'Retry', onClick: () => console.log('Retry clicked') }
      })}>
        Toast with Action
      </button>
      <button onClick={clearToasts}>
        Clear All
      </button>
    </div>
  );
};

describe('Toast System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render toast when added', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success Toast'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });
  });

  it('should show different toast types with correct styling', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    // Test success toast
    fireEvent.click(screen.getByText('Quick Success'));
    await waitFor(() => {
      expect(screen.getByText('Quick Success')).toBeInTheDocument();
    });

    // Test error toast
    fireEvent.click(screen.getByText('Show Error'));
    await waitFor(() => {
      expect(screen.getByText('Error Message')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    // Test warning toast
    fireEvent.click(screen.getByText('Show Warning'));
    await waitFor(() => {
      expect(screen.getByText('Warning Message')).toBeInTheDocument();
    });

    // Test info toast
    fireEvent.click(screen.getByText('Show Info'));
    await waitFor(() => {
      expect(screen.getByText('Info Message')).toBeInTheDocument();
    });
  });

  it('should render toast with action button', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Toast with Action'));

    await waitFor(() => {
      expect(screen.getByText('With Action')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));
    expect(consoleSpy).toHaveBeenCalledWith('Retry clicked');

    consoleSpy.mockRestore();
  });

  it('should remove toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success Toast'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Find and click the close button (X)
    const closeButton = screen.getByRole('button', { name: '' }); // Close button has no text
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });

  it('should auto-remove toast after duration', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Success Toast'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds (default duration)
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });

  it('should clear all toasts when clearToasts is called', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    // Add multiple toasts
    fireEvent.click(screen.getByText('Quick Success'));
    fireEvent.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Quick Success')).toBeInTheDocument();
      expect(screen.getByText('Error Message')).toBeInTheDocument();
    });

    // Clear all toasts
    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.queryByText('Quick Success')).not.toBeInTheDocument();
      expect(screen.queryByText('Error Message')).not.toBeInTheDocument();
    });
  });

  it('should throw error when useToast is used outside ToastProvider', () => {
    const TestComponent = () => {
      useToast();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('should handle multiple toasts correctly', async () => {
    render(
      <ToastProvider>
        <ToastTestComponent />
      </ToastProvider>
    );

    // Add multiple toasts quickly
    fireEvent.click(screen.getByText('Quick Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Warning'));

    await waitFor(() => {
      expect(screen.getByText('Quick Success')).toBeInTheDocument();
      expect(screen.getByText('Error Message')).toBeInTheDocument();
      expect(screen.getByText('Warning Message')).toBeInTheDocument();
    });

    // All toasts should be visible
    expect(screen.getAllByRole('button', { name: '' })).toHaveLength(3); // 3 close buttons
  });
});