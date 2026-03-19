import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import NavigationMenu from './NavigationMenu';
import { NavigationItem } from '@/types/component.types';
import { Home, Files, User, Settings } from 'lucide-react';

// Mock Next.js navigation hooks
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

afterEach(() => {
  cleanup();
});

// Test data generators
const iconArbitrary = fc.constantFrom(
  <Home className="h-4 w-4" />,
  <Files className="h-4 w-4" />,
  <User className="h-4 w-4" />,
  <Settings className="h-4 w-4" />
);

const navigationItemArbitrary: fc.Arbitrary<NavigationItem> = fc.letrec((tie) => ({
  navigationItem: fc.record({
    label: fc.integer({ min: 0, max: 1000 }).map(i => `Item${i}`),
    href: fc.integer({ min: 0, max: 1000 }).map(i => `/path${i}`),
    icon: fc.option(iconArbitrary, { nil: undefined }),
    badge: fc.option(fc.oneof(fc.string({ minLength: 1, maxLength: 5 }), fc.integer({ min: 1, max: 99 })), { nil: undefined }),
    children: fc.option(fc.array(tie('navigationItem'), { maxLength: 2 }), { nil: undefined }),
  }),
})).navigationItem;

const navigationItemsArbitrary = fc.array(navigationItemArbitrary, { minLength: 1, maxLength: 5 });

const currentPathArbitrary = fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9-_/]/g, '').substring(0, 20)}`);

describe('NavigationMenu Property Tests', () => {
  /**
   * **Feature: frontend-pages-and-navigation, Property 5: Navigation Consistency**
   * 
   * For any authenticated page in the application, the navigation menu should be 
   * present and contain all required navigation items.
   * 
   * **Validates: Requirements 2.1**
   */
  it('Property 5: Navigation Consistency - navigation menu contains all provided items', () => {
    fc.assert(
      fc.property(
        navigationItemsArbitrary,
        currentPathArbitrary,
        (items, currentPath) => {
          // Mock the current path
          mockUsePathname.mockReturnValue(currentPath);

          const { container } = render(
            <NavigationMenu
              items={items}
              currentPath={currentPath}
              collapsed={false}
            />
          );

          // Verify all navigation items are present
          items.forEach((item, index) => {
            // Check that the navigation item label is present
            const navItems = screen.queryAllByText(item.label);
            expect(navItems.length).toBeGreaterThan(0);

            // If item has children, verify they can be expanded
            if (item.children && item.children.length > 0) {
              const expandButtons = screen.queryAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes(item.label)
              );
              expect(expandButtons.length).toBeGreaterThan(0);
              expandButtons.forEach(button => {
                expect(button).toHaveAttribute('aria-expanded', 'false');
              });
            }

            // If item has a badge, verify it's displayed
            if (item.badge) {
              const badgeText = typeof item.badge === 'string' ? item.badge : item.badge.toString();
              const badgeElements = screen.queryAllByText(badgeText);
              expect(badgeElements.length).toBeGreaterThan(0);
            }
          });

          // Verify navigation has proper accessibility attributes
          const navigation = screen.getByRole('navigation', { name: /main navigation/i });
          expect(navigation).toBeInTheDocument();

          // Verify mobile menu toggle is present
          const mobileToggles = screen.queryAllByRole('button').filter(button => 
            button.getAttribute('aria-label')?.includes('Toggle navigation menu')
          );
          expect(mobileToggles.length).toBeGreaterThan(0);
          mobileToggles.forEach(toggle => {
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 5: Navigation Consistency - active state highlighting works correctly', () => {
    fc.assert(
      fc.property(
        navigationItemsArbitrary,
        (items) => {
          // Test with the first item as the current path
          const firstItem = items[0];
          if (!firstItem) return true; // Skip if no items
          
          mockUsePathname.mockReturnValue(firstItem.href);

          render(
            <NavigationMenu
              items={items}
              currentPath={firstItem.href}
              collapsed={false}
            />
          );

          // Find links with the active item's href
          const activeLinks = screen.queryAllByRole('link').filter(link => 
            link.getAttribute('href') === firstItem.href
          );
          
          // At least one should have aria-current="page"
          const hasActivePage = activeLinks.some(link => 
            link.getAttribute('aria-current') === 'page'
          );
          
          expect(hasActivePage).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 5: Navigation Consistency - collapsed state maintains all items', () => {
    fc.assert(
      fc.property(
        navigationItemsArbitrary,
        currentPathArbitrary,
        (items, currentPath) => {
          mockUsePathname.mockReturnValue(currentPath);

          render(
            <NavigationMenu
              items={items}
              currentPath={currentPath}
              collapsed={true}
            />
          );

          // Verify all navigation items are still present when collapsed
          items.forEach((item) => {
            // Icons should still be visible, labels should be hidden
            if (item.icon) {
              const navItems = screen.queryAllByRole('link').concat(screen.queryAllByRole('button'));
              const itemExists = navItems.some(element => 
                element.getAttribute('href') === item.href || 
                element.getAttribute('aria-label')?.includes(item.label)
              );
              expect(itemExists).toBe(true);
            }
          });

          // Verify navigation structure is maintained
          const navigation = screen.getByRole('navigation', { name: /main navigation/i });
          expect(navigation).toBeInTheDocument();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 5: Navigation Consistency - responsive behavior maintains functionality', () => {
    fc.assert(
      fc.property(
        navigationItemsArbitrary,
        currentPathArbitrary,
        (items, currentPath) => {
          mockUsePathname.mockReturnValue(currentPath);

          render(
            <NavigationMenu
              items={items}
              currentPath={currentPath}
              collapsed={false}
            />
          );

          // Mobile menu toggle should be present
          const mobileToggles = screen.queryAllByRole('button').filter(button => 
            button.getAttribute('aria-label')?.includes('Toggle navigation menu')
          );
          expect(mobileToggles.length).toBeGreaterThan(0);

          // Desktop navigation should be present (class-based check)
          const navigation = screen.getByRole('navigation', { name: /main navigation/i });
          expect(navigation).toHaveClass('hidden', 'lg:flex');
        }
      ),
      { numRuns: 30 }
    );
  });
});