'use client';

import React from 'react';
import { Home, Files, User, Settings, Plus, Download } from 'lucide-react';
import { PageLayout } from './index';
import { Button } from '@/components/ui';
import { NavigationMenu } from '@/components/navigation';
import { BreadcrumbItem, NavigationItem } from '@/types/component.types';

const PageLayoutExample: React.FC = () => {
  // Sample navigation items
  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: 'Files',
      href: '/files',
      icon: <Files className="h-4 w-4" />,
      badge: '12',
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  // Sample breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Files' },
  ];

  // Sample sidebar content
  const sidebar = (
    <NavigationMenu
      items={navigationItems}
      currentPath="/files"
    />
  );

  // Sample page actions
  const actions = (
    <>
      <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
        Export
      </Button>
      <Button variant="default" size="sm" icon={<Plus className="h-4 w-4" />}>
        Upload Files
      </Button>
    </>
  );

  return (
    <PageLayout
      title="File Management"
      description="Manage your files and folders with ease"
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
      actions={actions}
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample content cards */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Recent Files</h3>
            <p className="text-muted-foreground text-sm">
              View and manage your recently uploaded files
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2 bg-accent rounded">
                <span className="text-sm">document.pdf</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-accent rounded">
                <span className="text-sm">image.jpg</span>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Storage Usage</h3>
            <p className="text-muted-foreground text-sm">
              Monitor your storage consumption
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Used</span>
                <span>2.4 GB / 10 GB</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-muted-foreground text-sm">
              Common file operations
            </p>
            <div className="mt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>
        </div>

        {/* Sample file list */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Files</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-border font-medium text-sm">
              <span>Name</span>
              <span>Size</span>
              <span>Modified</span>
              <span>Actions</span>
            </div>
            {[
              { name: 'document.pdf', size: '2.4 MB', modified: '2 hours ago' },
              { name: 'presentation.pptx', size: '5.1 MB', modified: '1 day ago' },
              { name: 'image.jpg', size: '1.2 MB', modified: '3 days ago' },
              { name: 'spreadsheet.xlsx', size: '890 KB', modified: '1 week ago' },
            ].map((file, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors">
                <span className="text-sm">{file.name}</span>
                <span className="text-sm text-muted-foreground">{file.size}</span>
                <span className="text-sm text-muted-foreground">{file.modified}</span>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PageLayoutExample;