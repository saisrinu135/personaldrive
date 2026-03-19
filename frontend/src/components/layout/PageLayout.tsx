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

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Desktop Sidebar */}
            <motion.aside
              animate={{
                width: sidebarCollapsed ? '4rem' : '16rem',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                'hidden lg:flex flex-col bg-card border-r border-border',
                'transition-all duration-300 ease-in-out'
              )}
              aria-label="Sidebar navigation"
            >
              <div className="flex-1 overflow-hidden">
                {React.cloneElement(sidebar as React.ReactElement, {
                  collapsed: sidebarCollapsed,
                  onToggle: toggleSidebarCollapse,
                })}
              </div>
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="fixed top-0 left-0 z-50 h-full w-80 bg-card border-r border-border shadow-lg lg:hidden"
                  aria-label="Mobile sidebar navigation"
                >
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Navigation</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Close sidebar"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Header */}
          <header className="bg-background border-b border-border px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile Sidebar Toggle */}
                {sidebar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="lg:hidden"
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}

                <div className="flex-1">
                  {/* Breadcrumbs */}
                  {breadcrumbs && breadcrumbs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-2"
                    >
                      <Breadcrumb items={breadcrumbs} />
                    </motion.div>
                  )}

                  {/* Page Title and Description */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                      {title}
                    </h1>
                    {description && (
                      <p className="mt-1 text-sm text-muted-foreground lg:text-base">
                        {description}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Page Actions & ThemeToggle */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center space-x-4 pr-2"
              >
                {actions && (
                  <div className="flex items-center space-x-2">
                    {actions}
                  </div>
                )}
                <ThemeToggle />
              </motion.div>
            </div>
          </header>

          {/* Page Content */}
          <main
            className="flex-1 overflow-auto bg-background"
            role="main"
            aria-label="Main content"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
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