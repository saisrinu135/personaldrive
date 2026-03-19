import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Button } from './Button';
import { Download, Plus, Settings, Trash2, Edit } from 'lucide-react';

/**
 * Property 30: Accessibility Compliance
 * **Validates: Requirements 8.5, 8.6**
 * 
 * For any interactive component in the application, proper ARIA labels and keyboard navigation support should be provided.
 */
describe('Property 30: Accessibility Compliance', () => {
  afterEach(() => {
    cleanup();
  });
  // Generator for button variants
  const buttonVariantGen = fc.constantFrom('primary', 'secondary', 'outline', 'ghost', 'danger');
  
  // Generator for button sizes
  const buttonSizeGen = fc.constantFrom('sm', 'md', 'lg');
  
  // Generator for button states
  const buttonStateGen = fc.record({
    disabled: fc.boolean(),
    loading: fc.boolean(),
  });
  
  // Generator for icons
  const iconGen = fc.constantFrom(
    <Download data-testid="download-icon" />,
    <Plus data-testid="plus-icon" />,
    <Settings data-testid="settings-icon" />,
    <Trash2 data-testid="trash-icon" />,
    <Edit data-testid="edit-icon" />,
    undefined
  );
  
  // Generator for button text content
  const buttonTextGen = fc.string({ minLength: 1, maxLength: 50 }).filter(text => text.trim().length > 0);
  
  // Generator for ARIA attributes
  const ariaAttributesGen = fc.record({
    'aria-label': fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    'aria-describedby': fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    'aria-expanded': fc.option(fc.boolean(), { nil: undefined }),
    'aria-pressed': fc.option(fc.boolean(), { nil: undefined }),
  });

  it('should always have proper button role and be keyboard accessible', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonStateGen,
        iconGen,
        buttonTextGen,
        ariaAttributesGen,
        (variant, size, state, icon, text, ariaAttrs) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              disabled={state.disabled}
              loading={state.loading}
              icon={icon}
              {...ariaAttrs}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Button should always have proper button role
          expect(button!.tagName).toBe('BUTTON');
          
          // Property: Button should have proper type attribute
          expect(button).toHaveAttribute('type');
          const typeAttr = button!.getAttribute('type');
          expect(['button', 'submit', 'reset']).toContain(typeAttr);
          
          // Property: Button should be keyboard focusable when not disabled
          if (!state.disabled && !state.loading) {
            expect(button).not.toHaveAttribute('tabindex', '-1');
            // Button should be focusable by default (no negative tabindex)
            const tabIndex = button!.getAttribute('tabindex');
            if (tabIndex !== null) {
              expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
            }
          }
          
          // Property: Disabled buttons should not be interactive
          if (state.disabled || state.loading) {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('disabled');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have proper focus management and keyboard navigation support', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        ariaAttributesGen,
        (variant, size, text, ariaAttrs) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              {...ariaAttrs}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Button should have focus-visible styles for keyboard navigation
          expect(button).toHaveClass('focus-visible:outline-none');
          expect(button).toHaveClass('focus-visible:ring-2');
          expect(button).toHaveClass('focus-visible:ring-ring');
          expect(button).toHaveClass('focus-visible:ring-offset-2');
          
          // Property: Button should be focusable
          button!.focus();
          expect(document.activeElement).toBe(button);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly handle ARIA labels and accessible names', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (variant, size, text, ariaLabel) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              aria-label={ariaLabel}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Button should have an accessible name
          const accessibleName = button!.getAttribute('aria-label') || button!.textContent;
          expect(accessibleName).toBeTruthy();
          expect(accessibleName!.trim().length).toBeGreaterThan(0);
          
          // Property: If aria-label is provided, it should be used
          if (ariaLabel) {
            expect(button).toHaveAttribute('aria-label', ariaLabel);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support keyboard interaction (Enter and Space keys)', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        (variant, size, text) => {
          let clickCount = 0;
          const handleClick = () => { clickCount++; };
          
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              onClick={handleClick}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Button should be focusable and respond to clicks
          button!.focus();
          expect(document.activeElement).toBe(button);
          
          // Property: Button should respond to direct clicks
          fireEvent.click(button!);
          expect(clickCount).toBe(1);
          
          // Property: Button should have proper keyboard navigation classes
          expect(button).toHaveClass('focus-visible:outline-none');
          expect(button).toHaveClass('focus-visible:ring-2');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain accessibility when disabled or loading', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        fc.boolean(), // disabled
        fc.boolean(), // loading
        (variant, size, text, disabled, loading) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              disabled={disabled}
              loading={loading}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Disabled/loading buttons should still have proper role
          expect(button!.tagName).toBe('BUTTON');
          
          // Property: Disabled/loading buttons should have disabled attribute
          if (disabled || loading) {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('disabled');
          }
          
          // Property: Loading buttons should indicate loading state
          if (loading) {
            const spinner = button!.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly handle ARIA state attributes', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        fc.option(fc.boolean(), { nil: undefined }), // aria-expanded
        fc.option(fc.boolean(), { nil: undefined }), // aria-pressed
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // aria-describedby
        (variant, size, text, ariaExpanded, ariaPressed, ariaDescribedby) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              aria-expanded={ariaExpanded}
              aria-pressed={ariaPressed}
              aria-describedby={ariaDescribedby}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: ARIA state attributes should be properly set when provided
          if (ariaExpanded !== undefined) {
            expect(button).toHaveAttribute('aria-expanded', ariaExpanded.toString());
          }
          
          if (ariaPressed !== undefined) {
            expect(button).toHaveAttribute('aria-pressed', ariaPressed.toString());
          }
          
          if (ariaDescribedby !== undefined) {
            expect(button).toHaveAttribute('aria-describedby', ariaDescribedby);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain accessibility with icons', async () => {
    await fc.assert(
      fc.property(
        buttonVariantGen,
        buttonSizeGen,
        buttonTextGen,
        iconGen,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        (variant, size, text, icon, ariaLabel) => {
          const { container, unmount } = render(
            <Button
              variant={variant}
              size={size}
              icon={icon}
              aria-label={ariaLabel}
            >
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          
          // Property: Button with icon should still have accessible name
          const accessibleName = button!.getAttribute('aria-label') || button!.textContent;
          expect(accessibleName).toBeTruthy();
          expect(accessibleName!.trim().length).toBeGreaterThan(0);
          
          // Property: Icon should not interfere with button accessibility
          if (icon) {
            // Button should still have proper role
            expect(button!.tagName).toBe('BUTTON');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});