// Dashboard Statistics Components
export { StorageUsageCard } from './StorageUsageCard';
export type { StorageUsageCardProps } from './StorageUsageCard';

export { FileCountCard } from './FileCountCard';
export type { FileCountCardProps } from './FileCountCard';

export { RecentFilesCard } from './RecentFilesCard';
export type { RecentFilesCardProps } from './RecentFilesCard';

export { StorageDistributionChart } from './StorageDistributionChart';
export type { 
  StorageDistributionChartProps, 
  StorageDistribution 
} from './StorageDistributionChart';

export { QuickActionsCard } from './QuickActionsCard';
export type { 
  QuickActionsCardProps, 
  QuickAction 
} from './QuickActionsCard';

// Example component
export { DashboardExample } from './DashboardExample';

// Re-export related types from other modules
export type { FileMetadata } from '@/types/file.types';
export type { DashboardStats } from '@/types/form.types';