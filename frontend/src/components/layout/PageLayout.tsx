'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Breadcrumb } from '@/components/navigation';
import { PageLayoutProps } from '@/types/component.types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  actions,
  breadcrumbs,
  sidebar,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Desktop Sidebar */}
            <aside
              className={cn(
                'hidden lg:flex flex-col flex-shrink-0 z-20',
                'transition-[width] duration-300 ease-in-out overflow-hidden',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
              aria-label="Sidebar navigation"
            >
              <div className="flex-1 overflow-hidden h-full">
                {React.cloneElement(sidebar as React.ReactElement, {
                  collapsed: sidebarCollapsed,
                  onToggle: () => setSidebarCollapsed(v => !v),
                })}
              </div>
            </aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 z-50 h-full w-72 shadow-2xl lg:hidden"
                  aria-label="Mobile sidebar navigation"
                >
                  <div className="flex items-center justify-end p-3 bg-white border-b border-border">
                    <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto h-full">
                    {React.cloneElement(sidebar as React.ReactElement, {
                      collapsed: false,
                      onToggle: undefined,
                    })}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-14 flex-shrink-0 bg-white border-b border-border flex items-center px-4 lg:px-6 gap-4 z-10">
            {/* Mobile hamburger */}
            {sidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Title / Breadcrumbs */}
            <div className="flex-1 min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <Breadcrumb items={breadcrumbs} />
              ) : (
                <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
              )}
              {description && !breadcrumbs?.length && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>

            {/* Actions + Theme toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions && <div className="flex items-center gap-2">{actions}</div>}
              <ThemeToggle />
            </div>
          </header>

          {/* Page Content */}
          <main
            className="flex-1 overflow-auto bg-slate-50"
            role="main"
            aria-label="Main content"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;