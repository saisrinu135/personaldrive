import { ValidationResult } from '@/types/component.types';

// File type categories
export const fileTypeCategories = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;

// File size limits (in bytes)
export const fileSizeLimits = {
  image: 5 * 1024 * 1024 * 1024, // 5GB
  document: 5 * 1024 * 1024 * 1024, // 5GB
  video: 5 * 1024 * 1024 * 1024, // 5GB
  audio: 5 * 1024 * 1024 * 1024, // 5GB
  archive: 5 * 1024 * 1024 * 1024, // 5GB
  default: 5 * 1024 * 1024 * 1024, // 5GB
} as const;

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  minSize?: number;
  allowedExtensions?: string[];
  blockedExtensions?: string[];
}

/**
 * Validates a single file
 */
export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const errors: string[] = [];

  // Check file type
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
  }

  // Check file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    if (!fileExtension || !options.allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`);
    }
  }

  if (options.blockedExtensions && options.blockedExtensions.length > 0) {
    if (fileExtension && options.blockedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`);
    }
  }

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(options.maxSize)}`);
  }

  if (options.minSize && file.size < options.minSize) {
    errors.push(`File size ${formatFileSize(file.size)} is below minimum required size of ${formatFileSize(options.minSize)}`);
  }

  // Check for empty files
  if (file.size === 0) {
    errors.push('File cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): {
  isValid: boolean;
  results: Array<{ file: File; validation: ValidationResult }>;
  globalErrors: string[];
} {
  const results = files.map(file => ({
    file,
    validation: validateFile(file, options),
  }));

  const globalErrors: string[] = [];
  const isValid = results.every(result => result.validation.isValid) && globalErrors.length === 0;

  return {
    isValid,
    results,
    globalErrors,
  };
}

/**
 * Gets file type category
 */
export function getFileCategory(file: File): keyof typeof fileTypeCategories | 'other' {
  for (const [category, types] of Object.entries(fileTypeCategories)) {
    if ((types as readonly string[]).includes(file.type)) {
      return category as keyof typeof fileTypeCategories;
    }
  }
  return 'other';
}

/**
 * Gets appropriate size limit for file type
 */
export function getFileSizeLimit(file: File): number {
  const category = getFileCategory(file);
  if (category === 'other') {
    return fileSizeLimits.default;
  }
  return fileSizeLimits[category] || fileSizeLimits.default;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates file name
 */
export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = [];

  // Check for empty name
  if (!fileName || fileName.trim() === '') {
    errors.push('File name cannot be empty');
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(fileName)) {
    errors.push('File name contains invalid characters: < > : " / \\ | ? *');
  }

  // Check length
  if (fileName.length > 255) {
    errors.push('File name is too long (maximum 255 characters)');
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExtension = fileName.split('.')[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExtension)) {
    errors.push(`File name "${nameWithoutExtension}" is reserved and cannot be used`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates validation options for specific file categories
 */
export function createFileValidationOptions(category: keyof typeof fileTypeCategories): FileValidationOptions {
  return {
    allowedTypes: [...fileTypeCategories[category]],
    maxSize: fileSizeLimits[category],
  };
}

/**
 * Validates drag and drop files
 */
export function validateDragDropFiles(
  dataTransfer: DataTransfer,
  options: FileValidationOptions = {}
): Promise<{
  validFiles: File[];
  invalidFiles: Array<{ file: File; errors: string[] }>;
  globalErrors: string[];
}> {
  return new Promise((resolve) => {
    const files = Array.from(dataTransfer.files);
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; errors: string[] }> = [];
    const globalErrors: string[] = [];

    // Check if any files were dropped
    if (files.length === 0) {
      globalErrors.push('No files were selected');
    }

    // Validate each file
    files.forEach(file => {
      const validation = validateFile(file, options);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          errors: validation.errors,
        });
      }
    });

    resolve({
      validFiles,
      invalidFiles,
      globalErrors,
    });
  });
}