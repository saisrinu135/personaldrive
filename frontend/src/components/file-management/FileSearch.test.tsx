import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileSearch } from './FileSearch';
import { FileItem } from '@/types/file.types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock components
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange, placeholder, icon, autoFocus, ...props }: any) => (
    <div>
      {icon}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        {...props}
      />
    </div>
  ),
}));

describe('FileSearch', () => {
  const mockFiles: FileItem[] = [
    {
      id: '1',
      name: 'document.pdf',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf',
      uploadDate: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'image.jpg',
      size: 2 * 1024 * 1024, // 2MB
      type: 'image/jpeg',
      uploadDate: new Date('2024-01-10'),
    },
    {
      id: '3',
      name: 'video.mp4',
      size: 50 * 1024 * 1024, // 50MB
      type: 'video/mp4',
      uploadDate: new Date('2024-01-05'),
    },
    {
      id: '4',
      name: 'archive.zip',
      size: 100 * 1024 * 1024, // 100MB
      type: 'application/zip',
      uploadDate: new Date('2024-01-01'),
    },
  ];

  const mockOnSearchResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        placeholder="Search files..."
      />
    );

    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
  });

  it('filters files by search query', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'document');

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'document.pdf',
            matchScore: expect.any(Number),
          })
        ])
      );
    });
  });

  it('shows clear button when search query exists', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'test');

    // Look for the clear button specifically (X icon button)
    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'test');
    
    // Find the clear button by text content
    const clearButton = screen.getByText('Clear Search');
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('shows advanced filters when filter button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Find the filter button by looking for the filter icon
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-funnel')
    );
    
    if (filterButton) {
      await user.click(filterButton);
    }

    await waitFor(() => {
      expect(screen.getByText('File Type')).toBeInTheDocument();
      expect(screen.getByText('File Size')).toBeInTheDocument();
      expect(screen.getByText('Upload Date')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });
  });

  it('filters files by type', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Open filters first
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-funnel')
    );
    
    if (filterButton) {
      await user.click(filterButton);
    }

    await waitFor(() => {
      // Select image type
      const typeSelect = screen.getByDisplayValue('All Types');
      user.selectOptions(typeSelect, 'image');
    });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'image.jpg',
            type: 'image/jpeg',
          })
        ])
      );
    });
  });

  it('filters files by size range', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Open filters first
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-funnel')
    );
    
    if (filterButton) {
      await user.click(filterButton);
    }

    await waitFor(() => {
      // Select small size range
      const sizeSelect = screen.getByDisplayValue('All Sizes');
      user.selectOptions(sizeSelect, 'small');
    });

    await waitFor(() => {
      const lastCall = mockOnSearchResults.mock.calls[mockOnSearchResults.mock.calls.length - 1];
      const results = lastCall[0];
      
      // Should only include files smaller than 10MB
      expect(results).toHaveLength(2); // document.pdf and image.jpg
      expect(results.every((file: any) => file.size < 10 * 1024 * 1024)).toBe(true);
    });
  });

  it('sorts files by name', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Files should be sorted by name by default
    await waitFor(() => {
      const lastCall = mockOnSearchResults.mock.calls[mockOnSearchResults.mock.calls.length - 1];
      const results = lastCall[0];
      
      // Should be sorted alphabetically
      expect(results[0].name).toBe('archive.zip');
      expect(results[1].name).toBe('document.pdf');
      expect(results[2].name).toBe('image.jpg');
      expect(results[3].name).toBe('video.mp4');
    });
  });

  it('toggles sort order', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Open filters first
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-funnel')
    );
    
    if (filterButton) {
      await user.click(filterButton);
    }

    await waitFor(() => {
      // Click sort order toggle
      const sortOrderButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg')?.classList.contains('lucide-sort-asc') ||
        btn.querySelector('svg')?.classList.contains('lucide-sort-desc')
      );
      if (sortOrderButton) {
        user.click(sortOrderButton);
      }
    });

    await waitFor(() => {
      const lastCall = mockOnSearchResults.mock.calls[mockOnSearchResults.mock.calls.length - 1];
      const results = lastCall[0];
      
      // Should be sorted in descending order
      expect(results[0].name).toBe('video.mp4');
      expect(results[1].name).toBe('image.jpg');
      expect(results[2].name).toBe('document.pdf');
      expect(results[3].name).toBe('archive.zip');
    });
  });

  it('calculates match scores correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'doc');

    await waitFor(() => {
      const lastCall = mockOnSearchResults.mock.calls[mockOnSearchResults.mock.calls.length - 1];
      const results = lastCall[0];
      
      // document.pdf should have higher match score than others
      const documentFile = results.find((file: any) => file.name === 'document.pdf');
      expect(documentFile).toBeDefined();
      expect(documentFile.matchScore).toBeGreaterThan(0);
    });
  });

  it('highlights search matches in file names', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'doc');

    await waitFor(() => {
      const lastCall = mockOnSearchResults.mock.calls[mockOnSearchResults.mock.calls.length - 1];
      const results = lastCall[0];
      
      const documentFile = results.find((file: any) => file.name === 'document.pdf');
      expect(documentFile.highlightedName).toContain('<mark');
      expect(documentFile.highlightedName).toContain('doc');
    });
  });

  it('shows search statistics', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'document');

    await waitFor(() => {
      expect(screen.getByText(/Found \d+ file/)).toBeInTheDocument();
      expect(screen.getByText(/matching "document"/)).toBeInTheDocument();
    });
  });

  it('handles empty search results', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/Found 0 files/)).toBeInTheDocument();
    });
  });

  it('clears all filters when clear filters button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={true}
      />
    );

    // Open filters first
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-funnel')
    );
    
    if (filterButton) {
      await user.click(filterButton);
    }

    await waitFor(async () => {
      // Change a filter
      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'image');

      // Click clear filters
      const clearFiltersButton = screen.getByText('Clear Filters');
      await user.click(clearFiltersButton);

      // Should reset to default
      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    });
  });

  it('does not show filters when showFilters is false', () => {
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        showFilters={false}
      />
    );

    // Should not have filter button - check that no buttons exist
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('auto focuses search input when autoFocus is true', () => {
    render(
      <FileSearch
        files={mockFiles}
        onSearchResults={mockOnSearchResults}
        autoFocus={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search files by name or type...');
    expect(searchInput).toHaveAttribute('autoFocus', '');
  });
});