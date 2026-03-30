'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, HardDrive, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

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
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full py-4 text-foreground">
      {/* Brand area */}
      <div className={cn("flex items-center mb-8 px-4 h-12 mt-2", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2 select-none">
            <img src="/icon-192.png" alt="CloudVault" className="h-8 w-8 rounded-lg flex-shrink-0" />
            <span className="font-semibold text-lg flex-shrink-0">CloudVault</span>
          </Link>
        )}
        
        {onToggle && !collapsed && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1 h-auto text-muted-foreground lg:flex hidden">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {onToggle && collapsed && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-2 h-auto text-muted-foreground lg:flex hidden mx-auto" aria-label="Expand sidebar">
            <ChevronRight className="h-5 w-5" />
          </Button>
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
      <div className="mt-auto px-2 pt-4 border-t border-border pb-4">
        <button
          onClick={() => logout()}
          className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors",
            collapsed ? "justify-center" : "justify-start"
          )}
          title={collapsed ? "Log Out" : undefined}
        >
          <LogOut className={cn("flex-shrink-0", collapsed ? "h-6 w-6 border-0" : "mr-3 h-5 w-5 border-0")} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};
