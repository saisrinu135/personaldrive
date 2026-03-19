'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Files, 
  User, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationItem, NavigationMenuProps } from '@/types/component.types';

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  currentPath,
  collapsed = false,
  onToggle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);

    return (
      <motion.div
        key={item.href}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: level * 0.1 }}
      >
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.href)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                active && 'bg-primary text-primary-foreground',
                collapsed && 'justify-center px-2',
                level > 0 && 'ml-4'
              )}
              aria-expanded={isExpanded}
              aria-label={`Toggle ${item.label} submenu`}
            >
              <div className="flex items-center">
                {item.icon && (
                  <span className={cn('flex-shrink-0', !collapsed && 'mr-3')}>
                    {item.icon}
                  </span>
                )}
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
              {!collapsed && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              )}
              {item.badge && !collapsed && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                active && 'bg-primary text-primary-foreground',
                collapsed && 'justify-center px-2',
                level > 0 && 'ml-4'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon && (
                <span className={cn('flex-shrink-0', !collapsed && 'mr-3')}>
                  {item.icon}
                </span>
              )}
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {item.badge && !collapsed && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )}

          {/* Active indicator */}
          {active && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
              layoutId="activeIndicator"
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
        </div>

        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && isExpanded && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map((child) =>
                  renderNavigationItem(child, level + 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <button
          onClick={toggleMobileMenu}
          className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <motion.div
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.div>
        </button>
      </div>

      {/* Desktop Navigation */}
      <nav
        className={cn(
          'hidden lg:flex flex-col space-y-1 p-4 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Toggle Button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="self-end p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
        )}

        {/* Navigation Items */}
        <div className="space-y-1">
          {items.map((item) => renderNavigationItem(item))}
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={toggleMobileMenu}
            />

            {/* Mobile Menu */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed top-0 left-0 z-50 h-full w-80 bg-background border-r shadow-lg lg:hidden"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-1 overflow-y-auto">
                {items.map((item) => renderNavigationItem(item))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavigationMenu;