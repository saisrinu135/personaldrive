'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FolderPlus, 
  Settings, 
  Search,
  Download,
  Share2,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  disabled?: boolean;
}

export interface QuickActionsCardProps {
  onUploadFiles?: () => void;
  onCreateFolder?: () => void;
  onManageProviders?: () => void;
  onSearchFiles?: () => void;
  customActions?: QuickAction[];
  className?: string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onUploadFiles,
  onCreateFolder,
  onManageProviders,
  onSearchFiles,
  customActions = [],
  className = '',
}) => {
  // Default quick actions
  const defaultActions: QuickAction[] = [
    {
      id: 'upload',
      label: 'Upload Files',
      icon: <Upload className="h-4 w-4" />,
      onClick: onUploadFiles || (() => {}),
      variant: 'default',
      disabled: !onUploadFiles,
    },
    {
      id: 'folder',
      label: 'New Folder',
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: onCreateFolder || (() => {}),
      variant: 'outline',
      disabled: !onCreateFolder,
    },
    {
      id: 'search',
      label: 'Search Files',
      icon: <Search className="h-4 w-4" />,
      onClick: onSearchFiles || (() => {}),
      variant: 'outline',
      disabled: !onSearchFiles,
    },
    {
      id: 'providers',
      label: 'Manage Storage',
      icon: <Settings className="h-4 w-4" />,
      onClick: onManageProviders || (() => {}),
      variant: 'secondary',
      disabled: !onManageProviders,
    },
  ];

  // Combine default and custom actions
  const allActions = [...defaultActions, ...customActions].filter(action => !action.disabled);

  return (
    <Card className={`${className}`} hover={true}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Primary actions (larger buttons) */}
          <div className="space-y-2">
            {allActions
              .filter(action => action.variant === 'default')
              .map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <Button
                    variant={action.variant}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="w-full justify-start"
                    icon={action.icon}
                  >
                    {action.label}
                  </Button>
                </motion.div>
              ))}
          </div>

          {/* Secondary actions (grid layout) */}
          <div className="grid grid-cols-2 gap-2">
            {allActions
              .filter(action => action.variant !== 'default')
              .map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: (index + 1) * 0.1 }}
                >
                  <Button
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="w-full justify-start text-xs h-8"
                    icon={action.icon}
                  >
                    {action.label}
                  </Button>
                </motion.div>
              ))}
          </div>

          {/* Empty state */}
          {allActions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                No actions available
              </p>
            </motion.div>
          )}

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2 border-t border-border"
          >
            <p className="text-xs text-muted-foreground text-center">
              Quick access to common file operations
            </p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;