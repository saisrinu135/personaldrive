import axiosInstance from '@/lib/axios';
import { APIResponse } from '@/types/auth.types';
import { FileMetadata } from '@/types/file.types';

// ─── Request / Response types ────────────────────────────────────────────────

export interface FileUploadOptions {
  /** UUID of the provider to upload into */
  providerId: string;
  /** Optional folder prefix, e.g. "documents/invoices" */
  folderPath?: string;
  /** Progress callback, called during upload */
  onProgress?: (progress: UploadProgress) => void;
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
  /** Filter by folder prefix */
  folderPath?: string;
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

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a single file to a storage provider.
 * Backend: POST /api/v1/objects/upload?provider_id=<uuid>[&folder_path=<path>]
 */
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResponse> => {
  const { providerId, folderPath = '', onProgress } = options;

  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams({ provider_id: providerId });
  if (folderPath) {
    params.append('folder_path', folderPath);
  }

  const fileId = `${Date.now()}-${file.name}`;

  if (onProgress) {
    onProgress({ fileId, fileName: file.name, progress: 0, status: 'uploading' });
  }

  try {
    const response = await axiosInstance.post<APIResponse<FileUploadResponse>>(
      `/api/v1/objects/upload?${params.toString()}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ fileId, fileName: file.name, progress, status: 'uploading' });
          }
        },
      }
    );

    if (onProgress) {
      onProgress({ fileId, fileName: file.name, progress: 100, status: 'completed' });
    }

    return response.data.data;
  } catch (error) {
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
  const { providerId, folderPath, search, page = 1, limit = 50 } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (providerId) params.append('provider_id', providerId);
  if (folderPath) params.append('folder_path', folderPath);
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

// ─── Download ────────────────────────────────────────────────────────────────

/**
 * Download a file and trigger a browser download.
 * Backend: GET /api/v1/objects/{object_id}/download  (returns a StreamingResponse)
 */
export const downloadFile = async (fileId: string, fileName?: string): Promise<void> => {
  const response = await axiosInstance.get(`/api/v1/objects/${fileId}/download`, {
    responseType: 'blob',
  });

  // Attempt to get filename from Content-Disposition header
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename=([^;]+)/);
  const resolvedName = fileName || match?.[1]?.trim() || fileId;

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = resolvedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
