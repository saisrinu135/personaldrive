'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, BreadcrumbProps } from '@/types/component.types';

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="h-4 w-4" />,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="flex items-center space-x-1 text-sm text-muted-foreground"
    >
      <ol className="flex items-center space-x-1" role="list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <motion.li
              key={`${item.href || item.label}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                ease: 'easeOut'
              }}
              className="flex items-center"
              role="listitem"
            >
              {/* Separator (except for first item) */}
              {!isFirst && (
                <span 
                  className="mx-2 text-muted-foreground/60" 
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}

              {/* Breadcrumb Item */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex items-center hover:text-foreground transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5',
                    'underline-offset-4 hover:underline'
                  )}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {isFirst && (
                    <Home className="h-3 w-3 mr-1" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center',
                    isLast && 'text-foreground font-medium',
                    !isLast && 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && (
                    <Home className="h-3 w-3 mr-1" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
};

// Utility function to generate breadcrumbs from pathname
export const generateBreadcrumbs = (
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: customLabels?.[''] || 'Home', href: '/' }
  ];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Use custom label if provided, otherwise format the segment
    const label = customLabels?.[currentPath] || 
                  segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    // Don't add href for the last segment (current page)
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });

  return breadcrumbs;
};

// Hook to use breadcrumbs with pathname
export const useBreadcrumbs = (
  customLabels?: Record<string, string>,
  pathname?: string
) => {
  // In a real app, you'd use usePathname() from next/navigation
  // For now, we'll accept it as a parameter for testing
  const currentPath = pathname || '/';
  
  return React.useMemo(() => {
    return generateBreadcrumbs(currentPath, customLabels);
  }, [currentPath, customLabels]);
};

export default Breadcrumb;