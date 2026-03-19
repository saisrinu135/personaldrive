'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface StorageUsageCardProps {
  storageUsed: number;
  storageLimit: number;
  className?: string;
}

export const StorageUsageCard: React.FC<StorageUsageCardProps> = ({
  storageUsed,
  storageLimit,
  className = '',
}) => {
  // Calculate usage percentage
  const usagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
  
  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get progress bar color based on usage
  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get text color for percentage
  const getTextColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-600 dark:text-green-400';
    if (percentage < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className={`${className}`} hover={true}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
        <HardDrive className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Usage statistics */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {formatBytes(storageUsed)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatBytes(storageLimit)} used
              </p>
            </div>
            <div className={`text-right ${getTextColor(usagePercentage)}`}>
              <p className="text-2xl font-bold">
                {usagePercentage.toFixed(1)}%
              </p>
              <p className="text-xs flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Usage
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor(usagePercentage)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                transition={{
                  duration: 1,
                  ease: 'easeOut',
                }}
              />
            </div>
            
            {/* Available space */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {formatBytes(storageUsed)}</span>
              <span>Available: {formatBytes(storageLimit - storageUsed)}</span>
            </div>
          </div>

          {/* Warning message for high usage */}
          {usagePercentage > 90 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md"
            >
              <p className="text-xs text-red-600 dark:text-red-400">
                Storage almost full. Consider upgrading or deleting unused files.
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageUsageCard;