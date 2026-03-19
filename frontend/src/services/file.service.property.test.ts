import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  uploadFile,
  getDownloadUrl,
  FileUploadOptions,
  FileUploadResponse,
  FileDownloadResponse,
} from './file.service';
import axiosInstance from '@/lib/axios';

// Mock axios
vi.mock('@/lib/axios');

/**
 * **Validates: Requirements 9.8**
 * 
 * Property 33: File Content Round-Trip
 * For any valid file uploaded to the system, downloading and comparing the content 
 * should produce identical results to the original file.
 */
describe('Property 33: File Content Round-Trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should preserve file content through upload-download round-trip for any valid file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate various file contents
          content: fc.oneof(
            // Text content
            fc.string({ minLength: 0, maxLength: 1000 }),
            // Binary-like content (simulated with specific byte patterns)
            fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 0, maxLength: 500 })
              .map(bytes => new Uint8Array(bytes))
              .map(uint8Array => Array.from(uint8Array).map(b => String.fromCharCode(b)).join('')),
            // JSON content
            fc.jsonValue().map(obj => JSON.stringify(obj)),
            // CSV-like content
            fc.array(
              fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
              { minLength: 1, maxLength: 10 }
            ).map(rows => rows.map(row => row.join(',')).join('\n')),
            // Empty content
            fc.constant(''),
          ),
          // Generate various file names and types
          fileName: fc.oneof(
            fc.constant('test.txt'),
            fc.constant('data.json'),
            fc.constant('document.csv'),
            fc.constant('file.bin'),
            fc.string({ minLength: 1, maxLength: 50 })
              .filter(name => name.length > 0 && !name.includes('/') && !name.includes('\\'))
              .map(name => `${name}.txt`)
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
            fc.string({ minLength: 0, maxLength: 50 })
              .filter(path => !path.includes('..') && !path.startsWith('/'))
          ),
        }),
        async ({ content, fileName, contentType, providerId, folderPath }) => {
          // Create a File object with the generated content
          const originalFile = new File([content], fileName, { type: contentType });
          
          // Mock the upload response
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

          // Mock the download response with a blob URL that contains the original content
          const mockDownloadResponse: FileDownloadResponse = {
            download_url: 'https://mock-download-url.com/file',
            expires_in: 3600,
            filename: fileName,
            content_type: contentType,
            size_bytes: content.length,
          };

          // Mock axios responses
          const mockAxios = vi.mocked(axiosInstance);
          mockAxios.post.mockResolvedValueOnce({ data: mockUploadResponse });
          mockAxios.get.mockResolvedValueOnce({ data: mockDownloadResponse });

          // Mock fetch to return the original content when the download URL is accessed
          global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: () => Promise.resolve(new Blob([content], { type: contentType })),
          });

          try {
            // Step 1: Upload the file
            const uploadOptions: FileUploadOptions = {
              providerId,
              folderPath: folderPath || undefined,
            };

            const uploadResult = await uploadFile(originalFile, uploadOptions);
            
            // Verify upload was called correctly
            expect(mockAxios.post).toHaveBeenCalledWith(
              `/api/v1/objects/upload/${providerId}`,
              expect.any(FormData),
              expect.objectContaining({
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })
            );

            // Step 2: Get download URL
            const downloadData = await getDownloadUrl(uploadResult.id, providerId);
            
            // Verify download URL request was made correctly
            expect(mockAxios.get).toHaveBeenCalledWith(
              `/api/v1/objects/${uploadResult.id}/download/${providerId}`
            );

            // Step 3: Fetch the file content from the download URL
            const response = await fetch(downloadData.download_url);
            const downloadedBlob = await response.blob();
            
            // Step 4: Compare the downloaded content with the original
            const downloadedContent = await downloadedBlob.text();
            
            // The round-trip property: downloaded content should be identical to original
            expect(downloadedContent).toBe(content);
            expect(downloadedBlob.size).toBe(originalFile.size);
            expect(downloadedBlob.type).toBe(contentType);
            
            // Additional metadata checks
            expect(uploadResult.filename).toBe(fileName);
            expect(uploadResult.size_bytes).toBe(content.length);
            expect(downloadData.filename).toBe(fileName);
            expect(downloadData.size_bytes).toBe(content.length);
            
          } catch (error) {
            // If any step fails, the round-trip property is violated
            throw new Error(`Round-trip property violated: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      ),
      { 
        numRuns: 100,
        timeout: 10000, // 10 second timeout for async operations
      }
    );
  });

  it('should handle binary file content round-trip correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate binary content using Uint8Array
          binaryContent: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 0, maxLength: 1000 }),
          fileName: fc.constant('binary-file.bin'),
          providerId: fc.uuid(),
        }),
        async ({ binaryContent, fileName, providerId }) => {
          const uint8Array = new Uint8Array(binaryContent);
          const originalFile = new File([uint8Array], fileName, { type: 'application/octet-stream' });
          
          // Mock responses
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

          const mockDownloadResponse: FileDownloadResponse = {
            download_url: 'https://mock-download-url.com/binary',
            expires_in: 3600,
            filename: fileName,
            content_type: 'application/octet-stream',
            size_bytes: uint8Array.length,
          };

          const mockAxios = vi.mocked(axiosInstance);
          mockAxios.post.mockResolvedValueOnce({ data: mockUploadResponse });
          mockAxios.get.mockResolvedValueOnce({ data: mockDownloadResponse });

          // Mock fetch to return the original binary content
          global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: () => Promise.resolve(new Blob([uint8Array], { type: 'application/octet-stream' })),
            arrayBuffer: () => Promise.resolve(uint8Array.buffer),
          });

          // Upload and download
          const uploadResult = await uploadFile(originalFile, { providerId });
          const downloadData = await getDownloadUrl(uploadResult.id, providerId);
          const response = await fetch(downloadData.download_url);
          const downloadedBuffer = await response.arrayBuffer();
          const downloadedArray = new Uint8Array(downloadedBuffer);

          // Binary round-trip property: every byte should be identical
          expect(downloadedArray.length).toBe(uint8Array.length);
          for (let i = 0; i < uint8Array.length; i++) {
            expect(downloadedArray[i]).toBe(uint8Array[i]);
          }
        }
      ),
      { 
        numRuns: 50,
        timeout: 10000,
      }
    );
  });

  it('should preserve file metadata through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          content: fc.string({ minLength: 1, maxLength: 100 }),
          fileName: fc.string({ minLength: 1, maxLength: 50 })
            .filter(name => name.length > 0 && !name.includes('/'))
            .map(name => `${name}.txt`),
          contentType: fc.oneof(
            fc.constant('text/plain'),
            fc.constant('application/json'),
            fc.constant('text/csv'),
          ),
          providerId: fc.uuid(),
          metadata: fc.option(
            fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
            { nil: undefined }
          ),
        }),
        async ({ content, fileName, contentType, providerId, metadata }) => {
          const originalFile = new File([content], fileName, { type: contentType });
          
          const mockUploadResponse: FileUploadResponse = {
            id: 'metadata-test-id',
            provider_id: providerId,
            user_id: 'test-user',
            s3_key: fileName,
            filename: fileName,
            content_type: contentType,
            size_bytes: content.length,
            meta: metadata,
            uploaded_at: new Date().toISOString(),
          };

          const mockDownloadResponse: FileDownloadResponse = {
            download_url: 'https://mock-download-url.com/metadata',
            expires_in: 3600,
            filename: fileName,
            content_type: contentType,
            size_bytes: content.length,
          };

          const mockAxios = vi.mocked(axiosInstance);
          mockAxios.post.mockResolvedValueOnce({ data: mockUploadResponse });
          mockAxios.get.mockResolvedValueOnce({ data: mockDownloadResponse });

          global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: () => Promise.resolve(new Blob([content], { type: contentType })),
          });

          // Upload with metadata
          const uploadOptions: FileUploadOptions = {
            providerId,
            metadata,
          };

          const uploadResult = await uploadFile(originalFile, uploadOptions);
          const downloadData = await getDownloadUrl(uploadResult.id, providerId);
          
          // Metadata preservation property
          expect(uploadResult.filename).toBe(fileName);
          expect(uploadResult.content_type).toBe(contentType);
          expect(uploadResult.size_bytes).toBe(content.length);
          expect(uploadResult.meta).toEqual(metadata);
          
          expect(downloadData.filename).toBe(fileName);
          expect(downloadData.content_type).toBe(contentType);
          expect(downloadData.size_bytes).toBe(content.length);
        }
      ),
      { 
        numRuns: 50,
        timeout: 10000,
      }
    );
  });
});