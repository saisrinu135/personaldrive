'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateFolderBreadcrumbs } from '@/services/file.service';

export interface FolderBreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  currentPath,
  onNavigate,
  className = '',
}) => {
  const breadcrumbs = generateFolderBreadcrumbs(currentPath);

  return (
    <nav
      aria-label="Folder navigation"
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={item.path || 'root'}>
            {/* Separator */}
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}

            {/* Breadcrumb Item */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center"
            >
              {isLast ? (
                <span className="flex items-center font-medium text-gray-900 dark:text-gray-100">
                  {isFirst ? (
                    <Home className="h-4 w-4 mr-1" />
                  ) : (
                    <Folder className="h-4 w-4 mr-1" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(item.path)}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1 h-auto font-normal"
                >
                  {isFirst ? (
                    <Home className="h-4 w-4 mr-1" />
                  ) : (
                    <Folder className="h-4 w-4 mr-1" />
                  )}
                  {item.label}
                </Button>
              )}
            </motion.div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default FolderBreadcrumb;