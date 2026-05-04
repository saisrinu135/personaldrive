'use client';

import React, { memo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = memo(({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={items[0]?.onClick}
          className="p-1 h-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Home className="w-4 h-4" />
        </Button>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          {index === items.length - 1 ? (
            // Last item - not clickable
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          ) : (
            // Clickable items
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className="p-1 h-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {item.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
});

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;