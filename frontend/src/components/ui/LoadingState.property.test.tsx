import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from './Button';
import React from 'react';

/**
 * **Validates: Requirements 8.3**
 * 
 * Property 29: Loading State Display
 * For any asynchronous operation in the application, loading indicators 
 * should be displayed while the operation is in progress.
 */
describe('Property 29: Loading State Display', () => {
  it('should always display loading indicators when loading prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('default', 'secondary', 'outline', 'ghost', 'danger'),
          size: fc.constantFrom('sm', 'md', 'lg'),
          children: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (props) => {
          render(
            <Button {...props} loading={true}>
              {props.children}
            </Button>
          );

          // Should display loading spinner when loading is true
          const loadingSpinner = screen.getByRole('button');
          expect(loadingSpinner).toBeInTheDocument();
          expect(loadingSpinner).toBeDisabled();
          
          // Should contain loading indicator (spinner)
          const spinner = loadingSpinner.querySelector('svg');
          expect(spinner).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display loading indicators when loading prop is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('default', 'secondary', 'outline', 'ghost', 'danger'),
          size: fc.constantFrom('sm', 'md', 'lg'),
          children: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (props) => {
          render(
            <Button {...props} loading={false}>
              {props.children}
            </Button>
          );

          // Should not be disabled when not loading
          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
          expect(button).not.toBeDisabled();
        }
      ),
      { numRuns: 100 }
    );
  });
});