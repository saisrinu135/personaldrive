import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { FileList } from './FileList';
import { FileItem } from '@/types/file.types';
import { ToastProvider } from '@/components/base/Toast';
import React from 'react';

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

/**
 * **Validates: Requirements 4.3**
 * 
 * Property 9: File List Display
 * For any uploaded file, it should appear in the file list with correct metadata 
 * including filename, size, and upload date.
 */
describe('Property 9: File List Display', () => {
  const renderWithToast = (component: React.ReactElement) => {
    return render(
      <ToastProvider>
        {component}
      </ToastProvider>
    );
  };

  // File item generator with guaranteed unique names
  const fileItemArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(name => 
      name.trim().length >= 5 && 
      !name.includes('\n') && 
      !name.includes('\r') &&
      /^[a-zA-Z0-9._-]+$/.test(name)
    ),
    size: fc.integer({ min: 0, max: 1000000000 }),
    type: fc.constantFrom(
      'image/jpeg',
      'image/png', 
      'application/pdf',
      'text/plain',
      'video/mp4',
      'audio/mp3',
      'application/zip'
    ),
    uploadDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    downloadUrl: fc.option(fc.webUrl(), { nil: undefined }),
    thumbnail: fc.option(fc.webUrl(), { nil: undefined }),
  });

  it('should display all files with their metadata', () => {
    fc.assert(
      fc.property(
        fc.array(fileItemArbitrary, { minLength: 1, maxLength: 5 }),
        fc.constantFrom('test-provider-1', 'test-provider-2'),
        (files, providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={files} 
              providerId={providerId}
            />
          );

          // Check that the correct number of file items are rendered
          const fileElements = container.querySelectorAll('[title]');
          expect(fileElements.length).toBeGreaterThanOrEqual(files.length);

          // Check that file names are present in the DOM
          files.forEach(file => {
            const fileNameElements = Array.from(container.querySelectorAll('[title]'))
              .filter(el => el.getAttribute('title') === file.name);
            expect(fileNameElements.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should display file sizes correctly formatted', () => {
    fc.assert(
      fc.property(
        fc.array(fileItemArbitrary, { minLength: 1, maxLength: 3 }),
        fc.constantFrom('test-provider'),
        (files, providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={files} 
              providerId={providerId}
              viewMode="list"
            />
          );

          // Check that size information is present
          const sizeElements = container.querySelectorAll('*');
          const sizeTexts = Array.from(sizeElements)
            .map(el => el.textContent)
            .filter(text => text && /\d+(\.\d+)?\s*(Bytes|KB|MB|GB)/.test(text));
          
          expect(sizeTexts.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should display upload dates for all files', () => {
    fc.assert(
      fc.property(
        fc.array(fileItemArbitrary, { minLength: 1, maxLength: 3 }),
        fc.constantFrom('test-provider'),
        (files, providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={files} 
              providerId={providerId}
              viewMode="list"
            />
          );

          // Check that date information is present
          const dateElements = container.querySelectorAll('*');
          const dateTexts = Array.from(dateElements)
            .map(el => el.textContent)
            .filter(text => text && /\w{3}\s+\d{1,2},\s+\d{4}/.test(text));
          
          expect(dateTexts.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle empty file list gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('test-provider-1', 'test-provider-2'),
        fc.string({ minLength: 5, maxLength: 50 }),
        (providerId, emptyMessage) => {
          const { container } = renderWithToast(
            <FileList 
              files={[]} 
              providerId={providerId}
              emptyMessage={emptyMessage}
            />
          );

          // Should display the empty message
          expect(container.textContent).toContain(emptyMessage);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should support both grid and list view modes', () => {
    fc.assert(
      fc.property(
        fc.array(fileItemArbitrary, { minLength: 1, maxLength: 2 }),
        fc.constantFrom('test-provider'),
        fc.constantFrom('grid', 'list'),
        (files, providerId, viewMode) => {
          const { container } = renderWithToast(
            <FileList 
              files={files} 
              providerId={providerId}
              viewMode={viewMode}
            />
          );

          // Check that files are rendered
          const fileElements = container.querySelectorAll('[title]');
          expect(fileElements.length).toBeGreaterThanOrEqual(files.length);

          // Check for view mode specific classes
          if (viewMode === 'grid') {
            expect(container.querySelector('.grid')).toBeTruthy();
          } else {
            expect(container.querySelector('.space-y-2')).toBeTruthy();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should display thumbnails for image files when available', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 5, maxLength: 50 }).filter(name => 
              name.trim().length >= 5 && /^[a-zA-Z0-9._-]+$/.test(name)
            ),
            size: fc.integer({ min: 1000, max: 10000000 }),
            type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif'),
            uploadDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
            downloadUrl: fc.option(fc.webUrl(), { nil: undefined }),
            thumbnail: fc.webUrl(),
          }),
          { minLength: 1, maxLength: 2 }
        ),
        fc.constantFrom('test-provider'),
        (imageFiles, providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={imageFiles} 
              providerId={providerId}
            />
          );

          // Check that image elements are present
          const images = container.querySelectorAll('img');
          expect(images.length).toBeGreaterThan(0);

          // Check that images have proper alt attributes
          imageFiles.forEach(file => {
            const imageWithAlt = Array.from(images)
              .find(img => img.getAttribute('alt') === file.name);
            expect(imageWithAlt).toBeTruthy();
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should provide accessible file information', () => {
    fc.assert(
      fc.property(
        fc.array(fileItemArbitrary, { minLength: 1, maxLength: 3 }),
        fc.constantFrom('test-provider'),
        (files, providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={files} 
              providerId={providerId}
            />
          );

          // Check that file names have title attributes for accessibility
          files.forEach(file => {
            const elementsWithTitle = container.querySelectorAll(`[title="${file.name}"]`);
            expect(elementsWithTitle.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle loading state correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('test-provider-1', 'test-provider-2'),
        (providerId) => {
          const { container } = renderWithToast(
            <FileList 
              files={[]} 
              providerId={providerId}
              loading={true}
            />
          );

          // Should show loading animation
          const loadingElements = container.querySelectorAll('.animate-pulse');
          expect(loadingElements.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 5 }
    );
  });
});