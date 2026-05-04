'use client';

import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UploadProgress } from '@/types/file.types';

/**
 * Example component demonstrating FileUploader usage
 * This shows different configurations and use cases
 */
export const FileUploaderExample: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleProgress = (progress: UploadProgress) => {
    setUploadProgress(prev => {
      const existing = prev.find(p => p.fileId === progress.fileId);
      if (existing) {
        return prev.map(p => p.fileId === progress.fileId ? progress : p);
      }
      return [...prev, progress];
    });
  };

  const handleCustomUpload = async (files: File[]) => {
    console.log('Custom upload handler called with files:', files);
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Custom upload completed');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          FileUploader Component Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstrating different configurations and use cases
        </p>
      </div>

      {/* Basic FileUploader */}
      <Card>
        <CardHeader>
          <CardTitle>Basic File Uploader</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            providerId="example-provider-1"
            folderId="uploads"
            onProgress={handleProgress}
          />
        </CardContent>
      </Card>

      {/* Restricted File Types */}
      <Card>
        <CardHeader>
          <CardTitle>Images Only</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            providerId="example-provider-2"
            accept={['image/*']}
            maxSize={5 * 1024 * 1024} // 5MB
            folderId="images"
            onProgress={handleProgress}
          />
        </CardContent>
      </Card>

      {/* Single File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Single File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            providerId="example-provider-3"
            multiple={false}
            accept={['application/pdf', 'text/*']}
            maxSize={10 * 1024 * 1024} // 10MB
            folderId="documents"
            onProgress={handleProgress}
          />
        </CardContent>
      </Card>

      {/* Custom Upload Handler */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Upload Handler</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            providerId="example-provider-4"
            onUpload={handleCustomUpload}
            folderId="custom"
          />
        </CardContent>
      </Card>

      {/* Disabled State */}
      <Card>
        <CardHeader>
          <CardTitle>Disabled State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsDisabled(!isDisabled)}
              variant={isDisabled ? 'default' : 'secondary'}
            >
              {isDisabled ? 'Enable' : 'Disable'} Uploader
            </Button>
          </div>
          <FileUploader
            providerId="example-provider-5"
            disabled={isDisabled}
            folderId="disabled-test"
            onProgress={handleProgress}
          />
        </CardContent>
      </Card>

      {/* Progress Display */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadProgress.map((progress) => (
                <div key={progress.fileId} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{progress.fileName}</span>
                    <span className="text-gray-500">
                      {progress.status} - {progress.progress}%
                    </span>
                  </div>
                  {progress.error && (
                    <p className="text-red-500 text-xs mt-1">{progress.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploaderExample;
