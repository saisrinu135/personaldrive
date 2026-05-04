'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Files,
  HardDrive,
  Activity,
  Share2,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Cloud,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { listProviders } from '@/services/provider.service';
import { Provider, ProviderType } from '@/types/provider.types';

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Files', href: '/dashboard/files', icon: Files },
  { name: 'Buckets', href: '/dashboard/providers', icon: HardDrive },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity },
  { name: 'Shares', href: '/dashboard/shares', icon: Share2 },
  { name: 'Recycle Bin', href: '/dashboard/trash', icon: Trash2 },
];

// Map provider type to a recognizable icon/label
function getProviderIcon(type: ProviderType) {
  switch (type) {
    case ProviderType.AWS:
      return { bg: 'bg-orange-100', text: 'text-orange-600', label: 'AWS' };
    case ProviderType.CLOUDFLARE:
      return { bg: 'bg-amber-100', text: 'text-amber-600', label: 'CF' };
    case ProviderType.ORACLE:
      return { bg: 'bg-red-100', text: 'text-red-600', label: 'OCI' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'S3' };
  }
}

function formatGB(bytes?: number) {
  if (!bytes) return '0 GB';
  const gb = bytes / (1024 ** 3);
  return gb < 1 ? `${(gb * 1024).toFixed(0)} MB` : `${gb.toFixed(1)} GB`;
}

function formatGBUsed(gb?: number) {
  if (!gb) return '0 GB';
  return gb < 1 ? `${(gb * 1024).toFixed(0)} MB` : `${gb.toFixed(1)} GB`;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed = false,
  onToggle,
}) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    listProviders().then(setProviders).catch(() => {});
  }, []);

  // Compute initials for user avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex flex-col h-full bg-white border-r border-border text-foreground">
      {/* Brand */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-border flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cloud className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-base text-foreground">
              Cloud<span className="text-primary">Vault</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Cloud className="w-4 h-4 text-primary" />
          </div>
        )}
        {onToggle && !collapsed && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1 h-auto text-muted-foreground hidden lg:flex">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {onToggle && collapsed && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-2 h-auto text-muted-foreground hidden lg:flex" aria-label="Expand sidebar">
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Add Storage Account button */}
        {!collapsed && (
          <Link href="/dashboard/providers?add=true">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Add Storage Account
            </button>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard/providers?add=true">
            <button className="w-full flex items-center justify-center py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors" title="Add Storage Account">
              <Plus className="w-4 h-4" />
            </button>
          </Link>
        )}

        {/* Main navigation */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">
              Navigation
            </p>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Storage Accounts list */}
        {!collapsed && providers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">
              Storage Accounts
            </p>
            <div className="space-y-2">
              {providers.map(provider => {
                const meta = getProviderIcon(provider.provider_type);
                const usedGb = provider.usage?.total_size_gb ?? 0;
                const limitGb = provider.storage_limit_gb ?? 0;
                const pct = limitGb > 0 ? Math.min(100, (usedGb / limitGb) * 100) : 0;
                const displayName = provider.provider_name || provider.name;

                return (
                  <div
                    key={provider.id}
                    className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold', meta.bg, meta.text)}>
                      {meta.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-1" title="Active" />
                      </div>
                      {limitGb > 0 ? (
                        <>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatGBUsed(usedGb)} / {formatGBUsed(limitGb)}
                          </p>
                          <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-primary')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatGB(provider.usage?.total_size_bytes)} used
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add another */}
              <Link
                href="/dashboard/providers?add=true"
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Storage Account
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Plan card */}
      {!collapsed && (
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Upgrade Plan</p>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
              Need more storage? Upgrade your plan for more space and features.
            </p>
            <button className="w-full text-xs font-medium py-1.5 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className={cn('border-t border-border flex-shrink-0', collapsed ? 'p-2' : 'p-3')}>
        <div className={cn('flex items-center gap-2', collapsed ? 'justify-center' : '')}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
