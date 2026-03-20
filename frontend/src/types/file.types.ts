// File Management Types
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
  uploadDate: Date;
  lastModified: Date;
  checksum: string;
  thumbnail?: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  downloadUrl?: string;
  thumbnail?: string;
  isFolder?: boolean;
  folderPath?: string;
  providerId?: string;
}

// Folder Management Types
export interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  createdDate: Date;
  modifiedDate: Date;
  fileCount: number;
  totalSize: number;
}

export interface FolderOperation {
  type: 'create' | 'rename' | 'delete' | 'move';
  folderPath: string;
  newPath?: string;
  newName?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// File Component Props
export interface FileUploaderProps {
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onProgress?: (progress: number) => void;
  disabled?: boolean;
}

export interface FileListProps {
  files: FileItem[];
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  loading?: boolean;
  emptyMessage?: string;
}

// Storage Provider Types (extending existing)
export interface StorageProvider {
  id: string;
  name: string;
  type: 'aws' | 'oracle' | 'cloudflare';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  createdAt: Date;
  lastSync?: Date;
}