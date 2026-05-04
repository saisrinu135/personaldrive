'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Files, 
  HardDrive, 
  Activity, 
  Share2, 
  Trash2,
  Plus,
  ChevronDown,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { Provider } from '@/types/provider.types';

interface SidebarProps {
  selectedProvider?: string;
  providers: Provider[];
  onProviderSelect: (providerId: string) => void;
  onAddProvider: () => void;
  metrics?: any;
}

const providerIcons = {
  oracle: '🔴',
  aws: '🟠',
  cloudflare: '🟠',
  others: '☁️'
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedProvider,
  providers,
  onProviderSelect,
  onAddProvider,
  metrics
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Files, label: 'Files', path: '/dashboard/files' },
    { icon: HardDrive, label: 'Buckets', path: '/dashboard/providers' },
    { icon: Activity, label: 'Activity', path: '/dashboard/activity', disabled: true },
    { icon: Share2, label: 'Shares', path: '/dashboard/shares', disabled: true },
    { icon: Trash2, label: 'Recycle Bin', path: '/dashboard/trash', disabled: true }
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Cloud className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">CloudVault</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Navigation
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => !item.disabled && router.push(item.path)}
                disabled={item.disabled}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : item.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage Accounts */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Storage Accounts
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddProvider}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {providers.map((provider) => {
            const providerMetrics = metrics?.by_provider?.find(
              (m: any) => m.provider_id === provider.id
            );
            
            return (
              <div
                key={provider.id}
                onClick={() => onProviderSelect(provider.id)}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-sm">
                    {providerIcons[provider.provider_type as keyof typeof providerIcons] || '☁️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {provider.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(providerMetrics?.storage_used_bytes || 0)} • {providerMetrics?.file_count || 0} files
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;