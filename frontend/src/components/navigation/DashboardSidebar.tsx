'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, HardDrive, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Files', href: '/dashboard/files', icon: Folder },
  { name: 'Providers', href: '/dashboard/providers', icon: HardDrive },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed = false,
  onToggle,
}) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full py-4 text-foreground">
      {/* Brand area */}
      <div className={cn("flex items-center mb-8 px-4", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm text-white">CS</span>
          </div>
          {!collapsed && <span className="font-semibold text-lg flex-shrink-0">CloudStore</span>}
        </div>
        
        {onToggle && !collapsed && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1 h-auto text-muted-foreground lg:flex hidden">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {onToggle && collapsed && (
          <div className="absolute -right-3 top-6 bg-card border rounded-full hidden lg:block">
             <Button variant="ghost" size="sm" onClick={onToggle} className="p-1 h-auto rounded-full w-6">
                <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                collapsed ? "justify-center" : "justify-start"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("flex-shrink-0", collapsed ? "h-6 w-6" : "mr-3 h-5 w-5")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto px-2 pt-4 border-t border-border">
        <Link
          href="/"
          className={cn(
            "flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors",
            collapsed ? "justify-center" : "justify-start"
          )}
          title={collapsed ? "Log Out" : undefined}
        >
          <LogOut className={cn("flex-shrink-0", collapsed ? "h-6 w-6" : "mr-3 h-5 w-5")} />
          {!collapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </div>
  );
};
