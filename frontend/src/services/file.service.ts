import axiosInstance from '@/lib/axios';
import { FileMetadata, UploadProgress, FolderItem, FolderOperation } from '@/types/file.types';

/**
 * File Service Layer
 * 
 * Handles file operations including upload, download, and list operations.
 * Implements multipart upload with progress tracking and secure download URL generation.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * @example
 * // Upload a file with progress tracking
 * const file = document.querySelector('input[type="file"]').files[0];
 * await uploadFile(file, {
 *   providerId: 'provider-123',
 *   folderPath: 'documents',
 *   onProgress: (progress) => {
 *     console.log(`Upload progress: ${progress.progress}%`);
 *   }
 * });
 * 
 * @example
 * // List files from a provider
 * const { objects, total } = await listFiles({
 *   providerId: 'provider-123',
 *   page: 1,
 *   limit: 20
 * });
 * 
 * @example
 * // Download a file
 * await downloadFile('file-123', 'provider-123');
 */

export interface FileUploadOptions {
  providerId: string;
  folderPath?: string;
  onProgress?: (progress: UploadProgress) => void;
  metadata?: Record<string, any>;
}

export interface FileListOptions {
  providerId?: string;
  folderPath?: string;
  page?: number;
  limit?: number;
}

export interface FileDownloadResponse {
  download_url: string;
  expires_in: number;
  filename: string;
  content_type?: string;
  size_bytes: number;
}

export interface FileUploadResponse {
  id: string;
  provider_id: string;
  user_id: string;
  s3_key: string;
  filename: string;
  content_type?: string;
  etag?: string;
  size_bytes: number;
  meta?: Record<string, any>;
  uploaded_at: string;
  last_modified?: string;
}

export interface FileListResponse {
  objects: FileUploadResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Upload a file to the storage provider
 * Supports multipart upload with progress tracking
 * 
 * @param file - The file to upload
 * @param options - Upload options including provider ID and progress callback
 * @returns Promise with upload response
 */
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResponse> => {
  const { providerId, folderPath = '', onProgress, metadata } = options;

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('file', file);
  
  if (folderPath) {
    formData.append('folder_path', folderPath);
  }
  
  if (metadata) {
    formData.append('meta', JSON.stringify(metadata));
  }

  // Generate unique file ID for progress tracking
  const fileId = `${Date.now()}-${file.name}`;

  try {
    // Initialize progress
    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });
    }

    const response = await axiosInstance.post<FileUploadResponse>(
      `/api/v1/objects/upload/${providerId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              fileId,
              fileName: file.name,
              progress,
              status: 'uploading',
            });
          }
        },
      }
    );

    // Complete progress
    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 100,
        status: 'completed',
      });
    }

    return response.data;
  } catch (error) {
    // Error progress
    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
    throw error;
  }
};

/**
 * Upload multiple files with progress tracking
 * 
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Promise with array of upload responses
 */
export const uploadFiles = async (
  files: File[],
  options: FileUploadOptions
): Promise<FileUploadResponse[]> => {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  return Promise.all(uploadPromises);
};

/**
 * Get a secure download URL for a file
 * 
 * @param fileId - The ID of the file to download
 * @param providerId - The provider ID
 * @returns Promise with download URL and metadata
 */
export const getDownloadUrl = async (
  fileId: string,
  providerId: string
): Promise<FileDownloadResponse> => {
  const response = await axiosInstance.get<FileDownloadResponse>(
    `/api/v1/objects/${fileId}/download/${providerId}`
  );
  return response.data;
};

/**
 * Download a file directly
 * 
 * @param fileId - The ID of the file to download
 * @param providerId - The provider ID
 * @returns Promise that triggers browser download
 */
export const downloadFile = async (
  fileId: string,
  providerId: string
): Promise<void> => {
  const downloadData = await getDownloadUrl(fileId, providerId);
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = downloadData.download_url;
  link.download = downloadData.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * List files from storage
 * 
 * @param options - List options including provider ID, folder path, and pagination
 * @returns Promise with list of files and pagination info
 */
export const listFiles = async (
  options: FileListOptions = {}
): Promise<FileListResponse> => {
  const { providerId, folderPath, page = 1, limit = 50 } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (folderPath) {
    params.append('folder_path', folderPath);
  }
  
  const endpoint = providerId
    ? `/api/v1/objects/list/${providerId}?${params.toString()}`
    : `/api/v1/objects/list?${params.toString()}`;
  
  const response = await axiosInstance.get<FileListResponse>(endpoint);
  return response.data;
};

/**
 * Delete a file from storage
 * 
 * @param fileId - The ID of the file to delete
 * @param providerId - The provider ID
 * @returns Promise that resolves when file is deleted
 */
export const deleteFile = async (
  fileId: string,
  providerId: string
): Promise<void> => {
  await axiosInstance.delete(`/api/v1/objects/${fileId}/${providerId}`);
};

/**
 * Get file metadata
 * 
 * @param fileId - The ID of the file
 * @param providerId - The provider ID
 * @returns Promise with file metadata
 */
export const getFileMetadata = async (
  fileId: string,
  providerId: string
): Promise<FileUploadResponse> => {
  const response = await axiosInstance.get<FileUploadResponse>(
    `/api/v1/objects/${fileId}/${providerId}`
  );
  return response.data;
};

/**
 * Convert FileUploadResponse to FileMetadata
 * Helper function to transform API response to frontend type
 */
export const toFileMetadata = (response: FileUploadResponse): FileMetadata => {
  return {
    id: response.id,
    name: response.filename,
    size: response.size_bytes,
    type: response.content_type || 'application/octet-stream',
    path: response.s3_key,
    uploadDate: new Date(response.uploaded_at),
    lastModified: response.last_modified ? new Date(response.last_modified) : new Date(response.uploaded_at),
    checksum: response.etag || '',
  };
};

/**
 * Folder Management Operations
 */

/**
 * Create a new folder
 * 
 * @param folderPath - The path where to create the folder
 * @param folderName - The name of the new folder
 * @param providerId - The provider ID
 * @returns Promise that resolves when folder is created
 */
export const createFolder = async (
  folderPath: string,
  folderName: string,
  providerId: string
): Promise<void> => {
  const fullPath = folderPath ? `${folderPath}/${folderName}` : folderName;
  
  await axiosInstance.post(`/api/v1/objects/folder/${providerId}`, {
    folder_path: fullPath,
  });
};

/**
 * Rename a folder
 * 
 * @param oldPath - The current folder path
 * @param newName - The new folder name
 * @param providerId - The provider ID
 * @returns Promise that resolves when folder is renamed
 */
export const renameFolder = async (
  oldPath: string,
  newName: string,
  providerId: string
): Promise<void> => {
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = newName;
  const newPath = pathParts.join('/');
  
  await axiosInstance.put(`/api/v1/objects/folder/${providerId}`, {
    old_path: oldPath,
    new_path: newPath,
  });
};

/**
 * Delete a folder and all its contents
 * 
 * @param folderPath - The path of the folder to delete
 * @param providerId - The provider ID
 * @returns Promise that resolves when folder is deleted
 */
export const deleteFolder = async (
  folderPath: string,
  providerId: string
): Promise<void> => {
  await axiosInstance.delete(`/api/v1/objects/folder/${providerId}`, {
    data: { folder_path: folderPath },
  });
};

/**
 * Move a file to a different folder
 * 
 * @param fileId - The ID of the file to move
 * @param newFolderPath - The destination folder path
 * @param providerId - The provider ID
 * @returns Promise that resolves when file is moved
 */
export const moveFile = async (
  fileId: string,
  newFolderPath: string,
  providerId: string
): Promise<void> => {
  await axiosInstance.put(`/api/v1/objects/${fileId}/move/${providerId}`, {
    folder_path: newFolderPath,
  });
};

/**
 * Get folder structure and contents
 * 
 * @param folderPath - The folder path to explore
 * @param providerId - The provider ID
 * @returns Promise with folder contents
 */
export const getFolderContents = async (
  folderPath: string = '',
  providerId: string
): Promise<{
  folders: FolderItem[];
  files: FileUploadResponse[];
  currentPath: string;
  parentPath?: string;
}> => {
  const params = new URLSearchParams();
  if (folderPath) {
    params.append('folder_path', folderPath);
  }
  
  const response = await axiosInstance.get(
    `/api/v1/objects/folder/contents/${providerId}?${params.toString()}`
  );
  
  return response.data;
};

/**
 * Generate breadcrumb items from folder path
 * 
 * @param folderPath - The current folder path
 * @returns Array of breadcrumb items
 */
export const generateFolderBreadcrumbs = (folderPath: string): Array<{ label: string; path: string }> => {
  if (!folderPath) {
    return [{ label: 'Files', path: '' }];
  }
  
  const segments = folderPath.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Files', path: '' }];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    breadcrumbs.push({
      label: segment,
      path: currentPath,
    });
  });
  
  return breadcrumbs;
};
