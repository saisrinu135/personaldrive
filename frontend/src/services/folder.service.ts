import axiosInstance from '@/lib/axios';
import { APIResponse } from '@/types/auth.types';

export interface FolderItem {
  id: string;
  name: string;
  user_id: string;
  provider_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface FolderCreateRequest {
  name: string;
  parent_id?: string;
}

export interface FolderUpdateRequest {
  name?: string;
  parent_id?: string;
}

/**
 * Create a new folder
 */
export const createFolder = async (
  providerId: string,
  folderData: FolderCreateRequest
): Promise<FolderItem> => {
  const response = await axiosInstance.post<APIResponse<FolderItem>>(
    `/api/v1/folders/?provider_id=${providerId}`,
    folderData
  );
  return response.data.data;
};

/**
 * List folders in a specific location
 */
export const listFolders = async (
  providerId: string,
  parentId?: string
): Promise<FolderItem[]> => {
  const params = new URLSearchParams({ provider_id: providerId });
  if (parentId) {
    params.append('parent_id', parentId);
  }

  const response = await axiosInstance.get<APIResponse<FolderItem[]>>(
    `/api/v1/folders/?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Update a folder (rename or move)
 */
export const updateFolder = async (
  folderId: string,
  updateData: FolderUpdateRequest
): Promise<FolderItem> => {
  const response = await axiosInstance.put<APIResponse<FolderItem>>(
    `/api/v1/folders/${folderId}`,
    updateData
  );
  return response.data.data;
};

/**
 * Delete a folder and all its contents
 */
export const deleteFolder = async (folderId: string): Promise<void> => {
  await axiosInstance.delete(`/api/v1/folders/${folderId}`);
};

/**
 * Get breadcrumbs for a folder
 */
export const getFolderBreadcrumbs = async (folderId: string): Promise<BreadcrumbItem[]> => {
  const response = await axiosInstance.get<APIResponse<{ breadcrumbs: BreadcrumbItem[] }>>(
    `/api/v1/folders/${folderId}/breadcrumbs`
  );
  return response.data.data.breadcrumbs;
};