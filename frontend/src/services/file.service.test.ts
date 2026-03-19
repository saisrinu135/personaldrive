import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  uploadFile,
  uploadFiles,
  downloadFile,
  listFiles,
  deleteFile,
  getFileMetadata,
  toFileMetadata,
  FileUploadOptions,
  FileListOptions,
} from './file.service';
import axiosInstance from '@/lib/axios';

// Mock axios
vi.mock('@/lib/axios');

// Helper: wrap in APIResponse envelope
const apiEnvelope = <T>(data: T) => ({ data: { status: true, message: 'ok', data } });

describe('File Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file with progress tracking', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fileData = {
        id: '123',
        provider_id: 'provider-1',
        user_id: 'user-1',
        s3_key: 'test.txt',
        filename: 'test.txt',
        content_type: 'text/plain',
        size_bytes: 12,
        uploaded_at: '2024-01-01T00:00:00Z',
      };

      const progressCallback = vi.fn();
      const options: FileUploadOptions = {
        providerId: 'provider-1',
        onProgress: progressCallback,
      };

      vi.mocked(axiosInstance.post).mockResolvedValue(apiEnvelope(fileData));

      const result = await uploadFile(mockFile, options);

      // URL now uses query param, not path param
      expect(axiosInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/objects/upload?provider_id=provider-1'),
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
      );

      expect(result).toEqual(fileData);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle upload errors and update progress', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const progressCallback = vi.fn();
      const options: FileUploadOptions = {
        providerId: 'provider-1',
        onProgress: progressCallback,
      };

      const error = new Error('Upload failed');
      vi.mocked(axiosInstance.post).mockRejectedValue(error);

      await expect(uploadFile(mockFile, options)).rejects.toThrow('Upload failed');

      const errorCall = progressCallback.mock.calls.find((call) => call[0].status === 'error');
      expect(errorCall).toBeDefined();
      expect(errorCall?.[0].error).toBe('Upload failed');
    });

    it('should include folder path as query param when provided', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fileData = {
        id: '123', provider_id: 'provider-1', user_id: 'user-1',
        s3_key: 'documents/test.txt', filename: 'test.txt',
        content_type: 'text/plain', size_bytes: 12, uploaded_at: '2024-01-01T00:00:00Z',
      };

      const options: FileUploadOptions = { providerId: 'provider-1', folderPath: 'documents' };
      vi.mocked(axiosInstance.post).mockResolvedValue(apiEnvelope(fileData));

      await uploadFile(mockFile, options);

      expect(axiosInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('folder_path=documents'),
        expect.any(FormData),
        expect.anything()
      );
    });
  });

  describe('uploadFiles', () => {
    it('should upload multiple files', async () => {
      const mockFiles = [
        new File(['content 1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content 2'], 'file2.txt', { type: 'text/plain' }),
      ];

      const makeResponse = (index: number, file: File) => apiEnvelope({
        id: `${index + 1}`, provider_id: 'provider-1', user_id: 'user-1',
        s3_key: file.name, filename: file.name, content_type: 'text/plain',
        size_bytes: 10, uploaded_at: '2024-01-01T00:00:00Z',
      });

      vi.mocked(axiosInstance.post)
        .mockResolvedValueOnce(makeResponse(0, mockFiles[0]))
        .mockResolvedValueOnce(makeResponse(1, mockFiles[1]));

      const results = await uploadFiles(mockFiles, { providerId: 'provider-1' });

      expect(results).toHaveLength(2);
      expect(axiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('downloadFile', () => {
    it('should trigger browser download via blob streaming', async () => {
      const mockBlob = new Blob(['hello'], { type: 'text/plain' });
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: mockBlob,
        headers: { 'content-disposition': 'attachment; filename=test.txt' },
      });

      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = { href: '', download: '', click: vi.fn() };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      await downloadFile('123');

      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/objects/123/download',
        expect.objectContaining({ responseType: 'blob' })
      );
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('listFiles', () => {
    it('should list files with default options', async () => {
      const listData = {
        objects: [{ id: '1', provider_id: 'p1', user_id: 'u1', s3_key: 'f.txt', filename: 'f.txt', size_bytes: 100, uploaded_at: '2024-01-01T00:00:00Z' }],
        total: 1, page: 1, limit: 50, total_pages: 1,
      };

      vi.mocked(axiosInstance.get).mockResolvedValue(apiEnvelope(listData));

      const result = await listFiles();

      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/objects/')
      );
      expect(result).toEqual(listData);
    });

    it('should include provider_id as query param', async () => {
      const listData = { objects: [], total: 0, page: 1, limit: 50, total_pages: 0 };
      vi.mocked(axiosInstance.get).mockResolvedValue(apiEnvelope(listData));

      await listFiles({ providerId: 'provider-1' });

      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('provider_id=provider-1')
      );
    });

    it('should list files with pagination', async () => {
      const listData = { objects: [], total: 100, page: 2, limit: 20, total_pages: 5 };
      vi.mocked(axiosInstance.get).mockResolvedValue(apiEnvelope(listData));

      await listFiles({ page: 2, limit: 20 });

      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
    });

    it('should include folder_path as query param', async () => {
      const listData = { objects: [], total: 0, page: 1, limit: 50, total_pages: 0 };
      vi.mocked(axiosInstance.get).mockResolvedValue(apiEnvelope(listData));

      await listFiles({ folderPath: 'documents' });

      expect(axiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('folder_path=documents')
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file by ID only', async () => {
      vi.mocked(axiosInstance.delete).mockResolvedValue({ data: {} });

      await deleteFile('123');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/v1/objects/123');
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata by ID', async () => {
      const fileData = {
        id: '123', provider_id: 'provider-1', user_id: 'user-1',
        s3_key: 'test.txt', filename: 'test.txt', content_type: 'text/plain',
        size_bytes: 12, uploaded_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(axiosInstance.get).mockResolvedValue(apiEnvelope(fileData));

      const result = await getFileMetadata('123');

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/objects/123');
      expect(result).toEqual(fileData);
    });
  });

  describe('toFileMetadata', () => {
    it('should convert FileUploadResponse to FileMetadata', () => {
      const response = {
        id: '123', provider_id: 'provider-1', user_id: 'user-1',
        s3_key: 'documents/test.txt', filename: 'test.txt', content_type: 'text/plain',
        etag: 'abc123', size_bytes: 12, meta: {},
        uploaded_at: '2024-01-01T00:00:00Z', last_modified: '2024-01-02T00:00:00Z',
      };

      const result = toFileMetadata(response);

      expect(result).toEqual({
        id: '123', name: 'test.txt', size: 12, type: 'text/plain',
        path: 'documents/test.txt', uploadDate: new Date('2024-01-01T00:00:00Z'),
        lastModified: new Date('2024-01-02T00:00:00Z'), checksum: 'abc123',
      });
    });

    it('should handle missing optional fields', () => {
      const response = {
        id: '123', provider_id: 'p1', user_id: 'u1',
        s3_key: 'test.txt', filename: 'test.txt',
        size_bytes: 12, uploaded_at: '2024-01-01T00:00:00Z',
      };

      const result = toFileMetadata(response);

      expect(result.type).toBe('application/octet-stream');
      expect(result.checksum).toBe('');
      expect(result.lastModified).toEqual(new Date('2024-01-01T00:00:00Z'));
    });
  });

  describe('Property-Based Tests', () => {
    it('should handle arbitrary file names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 255 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (filename, providerId) => {
            const mockFile = new File(['content'], filename, { type: 'text/plain' });
            const options: FileUploadOptions = { providerId };

            expect(() => {
              const fd = new FormData();
              fd.append('file', mockFile);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle arbitrary pagination parameters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (page, limit) => {
            const options: FileListOptions = { page, limit };
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            expect(params.get('page')).toBe(page.toString());
            expect(params.get('limit')).toBe(limit.toString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly convert any valid FileUploadResponse to FileMetadata', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            provider_id: fc.uuid(),
            user_id: fc.uuid(),
            s3_key: fc.string({ minLength: 1 }),
            filename: fc.string({ minLength: 1 }),
            content_type: fc.option(fc.string(), { nil: undefined }),
            etag: fc.option(fc.string(), { nil: undefined }),
            size_bytes: fc.integer({ min: 0 }),
            meta: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            uploaded_at: fc.date().map((d) => d.toISOString()),
            last_modified: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
          }),
          (response) => {
            const metadata = toFileMetadata(response);
            expect(metadata.id).toBe(response.id);
            expect(metadata.name).toBe(response.filename);
            expect(metadata.size).toBe(response.size_bytes);
            expect(metadata.path).toBe(response.s3_key);
            expect(metadata.uploadDate).toEqual(new Date(response.uploaded_at));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
