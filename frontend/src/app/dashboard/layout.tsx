'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { DashboardSidebar } from '@/components/navigation/DashboardSidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Format title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/dashboard/files':
        return 'My Files';
      case '/dashboard/providers':
        return 'Storage Providers';
      case '/dashboard/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <PageLayout
      title={getPageTitle()}
      sidebar={<DashboardSidebar />}
    >
      {children}
    </PageLayout>
  );
}
