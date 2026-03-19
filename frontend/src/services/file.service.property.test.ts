import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  uploadFile,
  FileUploadOptions,
  FileUploadResponse,
} from './file.service';
import axiosInstance from '@/lib/axios';

// Mock axios
vi.mock('@/lib/axios');

// Helper: wrap in APIResponse envelope
const apiEnvelope = <T>(data: T) => ({ data: { status: true, message: 'ok', data } });

/**
 * Property 33: File Upload Round-Trip
 * For any valid file, uploading should return metadata matching the original file.
 */
describe('Property 33: File Upload Round-Trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should preserve file metadata through upload for any valid file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: fc.oneof(
            fc.string({ minLength: 0, maxLength: 1000 }),
            fc.jsonValue().map((obj) => JSON.stringify(obj)),
            fc.constant(''),
          ),
          fileName: fc.oneof(
            fc.constant('test.txt'),
            fc.constant('data.json'),
            fc.constant('document.csv'),
            fc.string({ minLength: 1, maxLength: 50 })
              .filter((n) => n.length > 0 && !n.includes('/') && !n.includes('\\'))
              .map((n) => `${n}.txt`)
          ),
          contentType: fc.oneof(
            fc.constant('text/plain'),
            fc.constant('application/json'),
            fc.constant('text/csv'),
            fc.constant('application/octet-stream'),
          ),
          providerId: fc.uuid(),
          folderPath: fc.oneof(
            fc.constant(''),
            fc.constant('documents'),
            fc.constant('uploads/test'),
          ),
        }),
        async ({ content, fileName, contentType, providerId, folderPath }) => {
          const originalFile = new File([content], fileName, { type: contentType });

          const mockUploadResponse: FileUploadResponse = {
            id: 'test-file-id',
            provider_id: providerId,
            user_id: 'test-user',
            s3_key: folderPath ? `${folderPath}/${fileName}` : fileName,
            filename: fileName,
            content_type: contentType,
            etag: 'mock-etag',
            size_bytes: content.length,
            uploaded_at: new Date().toISOString(),
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(apiEnvelope(mockUploadResponse));

          const uploadOptions: FileUploadOptions = {
            providerId,
            folderPath: folderPath || undefined,
          };

          const uploadResult = await uploadFile(originalFile, uploadOptions);

          // Upload URL should use query params
          expect(axiosInstance.post).toHaveBeenCalledWith(
            expect.stringContaining(`/api/v1/objects/upload?provider_id=${providerId}`),
            expect.any(FormData),
            expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
          );

          // Metadata round-trip property
          expect(uploadResult.filename).toBe(fileName);
          expect(uploadResult.size_bytes).toBe(content.length);
          expect(uploadResult.content_type).toBe(contentType);
          expect(uploadResult.provider_id).toBe(providerId);
        }
      ),
      {
        numRuns: 50,
        timeout: 10000,
      }
    );
  });

  it('should handle binary file content correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          binaryContent: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 0, maxLength: 1000 }),
          fileName: fc.constant('binary-file.bin'),
          providerId: fc.uuid(),
        }),
        async ({ binaryContent, fileName, providerId }) => {
          const uint8Array = new Uint8Array(binaryContent);
          const originalFile = new File([uint8Array], fileName, { type: 'application/octet-stream' });

          const mockUploadResponse: FileUploadResponse = {
            id: 'binary-file-id',
            provider_id: providerId,
            user_id: 'test-user',
            s3_key: fileName,
            filename: fileName,
            content_type: 'application/octet-stream',
            size_bytes: uint8Array.length,
            uploaded_at: new Date().toISOString(),
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(apiEnvelope(mockUploadResponse));

          const uploadResult = await uploadFile(originalFile, { providerId });

          expect(uploadResult.size_bytes).toBe(uint8Array.length);
          expect(uploadResult.content_type).toBe('application/octet-stream');
        }
      ),
      {
        numRuns: 50,
        timeout: 10000,
      }
    );
  });

  it('should preserve file metadata through upload with various content types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: fc.string({ minLength: 1, maxLength: 100 }),
          fileName: fc.string({ minLength: 1, maxLength: 50 })
            .filter((n) => n.length > 0 && !n.includes('/'))
            .map((n) => `${n}.txt`),
          contentType: fc.oneof(
            fc.constant('text/plain'),
            fc.constant('application/json'),
            fc.constant('text/csv'),
          ),
          providerId: fc.uuid(),
        }),
        async ({ content, fileName, contentType, providerId }) => {
          const originalFile = new File([content], fileName, { type: contentType });

          const mockUploadResponse: FileUploadResponse = {
            id: 'metadata-test-id',
            provider_id: providerId,
            user_id: 'test-user',
            s3_key: fileName,
            filename: fileName,
            content_type: contentType,
            size_bytes: content.length,
            uploaded_at: new Date().toISOString(),
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(apiEnvelope(mockUploadResponse));

          const uploadResult = await uploadFile(originalFile, { providerId });

          // Metadata preservation property
          expect(uploadResult.filename).toBe(fileName);
          expect(uploadResult.content_type).toBe(contentType);
          expect(uploadResult.size_bytes).toBe(content.length);
        }
      ),
      {
        numRuns: 50,
        timeout: 10000,
      }
    );
  });
});