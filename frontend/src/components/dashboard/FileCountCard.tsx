'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Files, TrendingUp, FileText, Image, Video, Music } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface FileCountCardProps {
  totalFiles: number;
  fileTypeBreakdown?: {
    documents: number;
    images: number;
    videos: number;
    audio: number;
    others: number;
  };
  className?: string;
}

export const FileCountCard: React.FC<FileCountCardProps> = ({
  totalFiles,
  fileTypeBreakdown,
  className = '',
}) => {
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'documents':
        return <FileText className="h-3 w-3" />;
      case 'images':
        return <Image className="h-3 w-3" />;
      case 'videos':
        return <Video className="h-3 w-3" />;
      case 'audio':
        return <Music className="h-3 w-3" />;
      default:
        return <Files className="h-3 w-3" />;
    }
  };

  // Get file type label
  const getFileTypeLabel = (type: string): string => {
    switch (type) {
      case 'documents':
        return 'Documents';
      case 'images':
        return 'Images';
      case 'videos':
        return 'Videos';
      case 'audio':
        return 'Audio';
      case 'others':
        return 'Others';
      default:
        return type;
    }
  };

  return (
    <Card className={`${className}`} hover={true}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Files</CardTitle>
        <Files className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total count */}
          <div className="flex items-center justify-between">
            <div>
              <motion.p
                className="text-2xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {formatNumber(totalFiles)}
              </motion.p>
              <p className="text-xs text-muted-foreground">
                Files stored
              </p>
            </div>
            <div className="text-right text-green-600 dark:text-green-400">
              <p className="text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active
              </p>
            </div>
          </div>

          {/* File type breakdown */}
          {fileTypeBreakdown && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">File Types</p>
              <div className="space-y-1">
                {Object.entries(fileTypeBreakdown).map(([type, count], index) => (
                  count > 0 && (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          {getFileTypeIcon(type)}
                        </span>
                        <span className="text-muted-foreground">
                          {getFileTypeLabel(type)}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatNumber(count)}
                      </span>
                    </motion.div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Empty state message */}
          {totalFiles === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2"
            >
              <p className="text-xs text-muted-foreground">
                No files uploaded yet
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileCountCard;