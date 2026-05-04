'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Files, HardDrive, Activity, Settings } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Files, label: 'Files', path: '/dashboard/files' },
    { icon: HardDrive, label: 'Buckets', path: '/dashboard/providers' },
    { icon: Activity, label: 'Activity', path: '/dashboard/activity', disabled: true },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => !item.disabled && router.push(item.path)}
              disabled={item.disabled}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : item.disabled
                  ? 'text-gray-300 dark:text-gray-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;