import axiosInstance from '@/lib/axios';
import { APIResponse } from '@/types/auth.types';
import { FileMetadata } from '@/types/file.types';

// ─── Request / Response types ────────────────────────────────────────────────

export interface FileUploadOptions {
  /** UUID of the provider to upload into */
  providerId: string;
  /** Optional folder ID, e.g. "uuid" */
  folderId?: string;
  /** Progress callback, called during upload */
  onProgress?: (progress: UploadProgress) => void;
  /** Optional abort controller to cancel the upload */
  abortController?: AbortController;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  /** 0-100 */
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileListOptions {
  /** Filter by provider UUID */
  providerId?: string;
  /** Filter by folder ID */
  folderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Shape of a single object returned by the backend */
export interface FileUploadResponse {
  id: string;
  provider_id: string;
  user_id: string;
  s3_key: string;
  filename: string;
  content_type?: string;
  etag?: string;
  size_bytes: number;
  meta?: Record<string, unknown>;
  uploaded_at: string;
  last_modified?: string;
}

/** Shape of `GET /objects/` response data */
export interface FileListResponse {
  objects: FileUploadResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserStatsResponse {
  total_count: number;
  total_size_bytes: number;
  by_type: {
    content_type: string;
    count: number;
    size_bytes: number;
  }[];
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a single file to a storage provider using multipart upload.
 * Backend: POST /api/v1/objects/multipart/*
 */
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResponse> => {
  const { providerId, folderId, onProgress, abortController } = options;
  const fileId = `${Date.now()}-${file.name}`;
  
  if (onProgress) {
    onProgress({ fileId, fileName: file.name, progress: 0, status: 'uploading' });
  }

  let uploadId = '';
  let s3Key = '';

  try {
    // 1. Init multipart upload
    const initResponse = await axiosInstance.post<APIResponse<{upload_id: string, s3_key: string, filename: string}>>(
      `/api/v1/objects/multipart/init?provider_id=${providerId}`,
      {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        folder_id: folderId
      },
      { signal: abortController?.signal }
    );
    
    uploadId = initResponse.data.data.upload_id;
    s3Key = initResponse.data.data.s3_key;
    const finalFilename = initResponse.data.data.filename;
    
    // 2. Upload chunks
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1; // handle 0 byte files
    const parts: { PartNumber: number, ETag: string }[] = [];
    
    let uploadedBytes = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      if (abortController?.signal.aborted) {
        throw new Error('Upload aborted');
      }
      
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;
      
      const formData = new FormData();
      formData.append('file', chunk);
      
      const partResponse = await axiosInstance.post<APIResponse<{PartNumber: number, ETag: string}>>(
        `/api/v1/objects/multipart/part?provider_id=${providerId}&s3_key=${encodeURIComponent(s3Key)}&upload_id=${uploadId}&part_number=${partNumber}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: abortController?.signal,
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.loaded) {
               // Calculate real-time progress combining completed chunks and current chunk
               const currentProgressBytes = uploadedBytes + progressEvent.loaded;
               const progress = Math.round((currentProgressBytes * 100) / (file.size || 1));
               onProgress({ fileId, fileName: file.name, progress: Math.min(progress, 99), status: 'uploading' });
            }
          }
        }
      );
      
      parts.push(partResponse.data.data);
      uploadedBytes += chunk.size;
      
      if (onProgress) {
        const progress = Math.round((uploadedBytes * 100) / (file.size || 1));
        onProgress({ fileId, fileName: file.name, progress: Math.min(progress, 99), status: 'uploading' });
      }
    }
    
    // 3. Complete multipart upload
    const completeResponse = await axiosInstance.post<APIResponse<FileUploadResponse>>(
      `/api/v1/objects/multipart/complete?provider_id=${providerId}&s3_key=${encodeURIComponent(s3Key)}&upload_id=${uploadId}&filename=${encodeURIComponent(finalFilename)}&content_type=${encodeURIComponent(file.type || 'application/octet-stream')}${folderId ? `&folder_id=${folderId}` : ''}`,
      {
        size_bytes: file.size,
        parts: parts,
        meta: {}
      },
      { signal: abortController?.signal }
    );
    
    if (onProgress) {
      onProgress({ fileId, fileName: file.name, progress: 100, status: 'completed' });
    }
    
    return completeResponse.data.data;
    
  } catch (error: any) {
    // Check if error is due to abort
    const isAborted = abortController?.signal.aborted || error.name === 'CanceledError' || error.message === 'canceled' || error.message === 'Upload aborted';
    
    // If we have an uploadId, we should try to abort the multipart upload on the server to cleanup chunks
    if (uploadId && s3Key && isAborted) {
      try {
        await axiosInstance.post(
          `/api/v1/objects/multipart/abort?provider_id=${providerId}&s3_key=${encodeURIComponent(s3Key)}&upload_id=${uploadId}`
        );
      } catch (abortErr) {
        console.error("Failed to abort multipart upload on server", abortErr);
      }
    }

    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: isAborted ? 'Upload cancelled' : (error instanceof Error ? error.message : 'Upload failed'),
      });
    }
    throw error;
  }
};

/**
 * Upload multiple files concurrently.
 */
export const uploadFiles = async (
  files: File[],
  options: FileUploadOptions
): Promise<FileUploadResponse[]> => {
  return Promise.all(files.map((file) => uploadFile(file, options)));
};

// ─── List ────────────────────────────────────────────────────────────────────

/**
 * List objects owned by the current user.
 * Backend: GET /api/v1/objects/?[provider_id=<uuid>][&page=N][&limit=N][&search=...][&folder_path=...]
 */
export const listFiles = async (
  options: FileListOptions = {}
): Promise<FileListResponse> => {
  const { providerId, folderId, search, page = 1, limit = 50 } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (providerId) params.append('provider_id', providerId);
  if (folderId) params.append('folder_id', folderId);
  if (search) params.append('search', search);

  const response = await axiosInstance.get<APIResponse<FileListResponse>>(
    `/api/v1/objects/?${params.toString()}`
  );

  return response.data.data;
};

// ─── Get metadata ────────────────────────────────────────────────────────────

/**
 * Get metadata for a single object.
 * Backend: GET /api/v1/objects/{object_id}
 */
export const getFileMetadata = async (fileId: string): Promise<FileUploadResponse> => {
  const response = await axiosInstance.get<APIResponse<FileUploadResponse>>(
    `/api/v1/objects/${fileId}`
  );
  return response.data.data;
};

export const getFilePreviewUrl = async (fileId: string): Promise<string> => {
  const response = await axiosInstance.get<APIResponse<{ url: string }>>(`/api/v1/objects/${fileId}/preview`);
  return response.data.data.url;
};

/**
 * Get a short-lived presigned URL for direct downloading.
 */
export const getFileDirectLink = async (fileId: string): Promise<string> => {
  const response = await axiosInstance.get<APIResponse<{ url: string }>>(`/api/v1/objects/${fileId}/direct-link?ttl=3600`);
  return response.data.data.url;
};

/**
 * Get aggregate statistics for the user's files natively parsed by PostgreSQL
 */
export const getUserStats = async (): Promise<UserStatsResponse> => {
  const response = await axiosInstance.get<APIResponse<UserStatsResponse>>('/api/v1/objects/stats');
  return response.data.data;
};

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Download a file and trigger a browser download.
 * Backend: GET /api/v1/objects/{object_id}/direct-link
 */
export const downloadFile = async (fileId: string, fileName?: string): Promise<void> => {
  const url = await getFileDirectLink(fileId);
  const link = document.createElement('a');
  link.href = url;
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Delete an object.
 * Backend: DELETE /api/v1/objects/{object_id}
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await axiosInstance.delete(`/api/v1/objects/${fileId}`);
};

// ─── Pure helpers ────────────────────────────────────────────────────────────

/**
 * Convert a FileUploadResponse to the local FileMetadata shape.
 */
export const toFileMetadata = (response: FileUploadResponse): FileMetadata => ({
  id: response.id,
  name: response.filename,
  size: response.size_bytes,
  type: response.content_type || 'application/octet-stream',
  path: response.s3_key,
  uploadDate: new Date(response.uploaded_at),
  lastModified: response.last_modified
    ? new Date(response.last_modified)
    : new Date(response.uploaded_at),
  checksum: response.etag || '',
});

/**
 * Generate breadcrumb nav items from a folder path string.
 */
export const generateFolderBreadcrumbs = (
  folderPath: string
): Array<{ label: string; path: string }> => {
  if (!folderPath) return [{ label: 'Files', path: '' }];

  const segments = folderPath.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [{ label: 'Files', path: '' }];

  let currentPath = '';
  segments.forEach((segment) => {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    breadcrumbs.push({ label: segment, path: currentPath });
  });

  return breadcrumbs;
};
