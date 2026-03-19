'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Download, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Archive,
  MoreVertical 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileMetadata } from '@/types/file.types';

export interface RecentFilesCardProps {
  recentFiles: FileMetadata[];
  onDownload?: (file: FileMetadata) => void;
  onViewAll?: () => void;
  className?: string;
  maxFiles?: number;
}

export const RecentFilesCard: React.FC<RecentFilesCardProps> = ({
  recentFiles,
  onDownload,
  onViewAll,
  className = '',
  maxFiles = 5,
}) => {
  // Get file type icon
  const getFileIcon = (file: FileMetadata) => {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (type.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    } else if (type.startsWith('audio/')) {
      return <Music className="w-4 h-4" />;
    } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="w-4 h-4" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
      return <Archive className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Limit files to display
  const filesToShow = recentFiles.slice(0, maxFiles);

  return (
    <Card className={`${className}`} hover={true}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Files</CardTitle>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {onViewAll && recentFiles.length > maxFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="h-6 px-2 text-xs"
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filesToShow.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <File className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                No recent files
              </p>
              <p className="text-xs text-muted-foreground">
                Upload some files to see them here
              </p>
            </motion.div>
          ) : (
            filesToShow.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="group flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                {/* File icon */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file)}
                </div>
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(file.uploadDate)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDownload ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(file)}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Show more indicator */}
        {recentFiles.length > maxFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center pt-2 border-t border-border mt-2"
          >
            <p className="text-xs text-muted-foreground">
              +{recentFiles.length - maxFiles} more files
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentFilesCard;