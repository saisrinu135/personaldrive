'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, FileText, Image, Video, Music, Archive, File } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface StorageDistribution {
  documents: { size: number; count: number; color: string };
  images: { size: number; count: number; color: string };
  videos: { size: number; count: number; color: string };
  audio: { size: number; count: number; color: string };
  archives: { size: number; count: number; color: string };
  others: { size: number; count: number; color: string };
}

export interface StorageDistributionChartProps {
  distribution: StorageDistribution;
  totalSize: number;
  className?: string;
}

export const StorageDistributionChart: React.FC<StorageDistributionChartProps> = ({
  distribution,
  totalSize,
  className = '',
}) => {
  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'documents':
        return <FileText className="h-4 w-4" />;
      case 'images':
        return <Image className="h-4 w-4" />;
      case 'videos':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'archives':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
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
      case 'archives':
        return 'Archives';
      case 'others':
        return 'Others';
      default:
        return type;
    }
  };

  // Calculate percentages and create chart data
  const chartData = Object.entries(distribution)
    .filter(([_, data]) => data.size > 0)
    .map(([type, data]) => ({
      type,
      size: data.size,
      count: data.count,
      color: data.color,
      percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
    }))
    .sort((a, b) => b.size - a.size);

  // Create SVG path for pie chart
  const createPieSlice = (
    percentage: number,
    startAngle: number,
    radius: number = 45,
    centerX: number = 50,
    centerY: number = 50
  ) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -90; // Start from top

  return (
    <Card className={`${className}`} hover={true}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Storage Distribution</CardTitle>
        <PieChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pie Chart */}
          {chartData.length > 0 ? (
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
                  {chartData.map((item, index) => {
                    const path = createPieSlice(item.percentage, currentAngle);
                    const sliceAngle = currentAngle;
                    currentAngle += (item.percentage / 100) * 360;
                    
                    return (
                      <motion.path
                        key={item.type}
                        d={path}
                        fill={item.color}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    );
                  })}
                  {/* Center circle for donut effect */}
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="hsl(var(--card))"
                    className="drop-shadow-sm"
                  />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">
                      {chartData.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Types
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <PieChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  No data to display
                </p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    {getFileTypeIcon(item.type)}
                    <span>{getFileTypeLabel(item.type)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {formatBytes(item.size)}
                  </p>
                  <p className="text-muted-foreground">
                    {item.percentage.toFixed(1)}% • {item.count} files
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total summary */}
          {totalSize > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-2 border-t border-border"
            >
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Storage</span>
                <span className="font-medium text-foreground">
                  {formatBytes(totalSize)}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageDistributionChart;