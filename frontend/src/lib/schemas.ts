import { z } from 'zod';
import { commonPatterns } from './validation';

// Base field schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')
  .regex(commonPatterns.name, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || commonPatterns.phone.test(val),
    'Please enter a valid phone number'
  );

export const urlSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || commonPatterns.url.test(val),
    'Please enter a valid URL starting with http:// or https://'
  );

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Profile schemas
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// File validation schemas
export const fileUploadSchema = z.object({
  name: z.string().min(1, 'Filename is required').max(255, 'Filename is too long'),
  size: z.number().min(1, 'File cannot be empty').max(5 * 1024 * 1024 * 1024, 'File size cannot exceed 5GB'),
  type: z.string().min(1, 'File type is required'),
});

export const folderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name is too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'Folder name contains invalid characters'),
});

// Provider configuration schemas
export const awsProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required').max(50, 'Provider name is too long'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().min(1, 'Region is required'),
  bucketName: z.string().min(1, 'Bucket name is required'),
});

export const oracleProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required').max(50, 'Provider name is too long'),
  namespace: z.string().min(1, 'Namespace is required'),
  bucketName: z.string().min(1, 'Bucket name is required'),
  region: z.string().min(1, 'Region is required'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
});

export const cloudflareProviderSchema = z.object({
  name: z.string().min(1, 'Provider name is required').max(50, 'Provider name is too long'),
  accountId: z.string().min(1, 'Account ID is required'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  bucketName: z.string().min(1, 'Bucket name is required'),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query is too long'),
  fileType: z.enum(['all', 'image', 'document', 'video', 'audio', 'other']).optional(),
  dateRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
});

// Domain-specific validation schemas
export const domainEmailSchema = (allowedDomains: string[]) =>
  emailSchema.refine(
    (email) => {
      if (allowedDomains.length === 0) return true;
      const domain = email.split('@')[1];
      return allowedDomains.includes(domain);
    },
    {
      message: `Email must be from one of these domains: ${allowedDomains.join(', ')}`,
    }
  );

// File type validation
export const imageFileSchema = fileUploadSchema.extend({
  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'File must be a valid image format'),
});

export const documentFileSchema = fileUploadSchema.extend({
  type: z
    .string()
    .regex(
      /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain)$/,
      'File must be a valid document format'
    ),
});

// Export type inference helpers
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type FolderData = z.infer<typeof folderSchema>;
export type AWSProviderData = z.infer<typeof awsProviderSchema>;
export type OracleProviderData = z.infer<typeof oracleProviderSchema>;
export type CloudflareProviderData = z.infer<typeof cloudflareProviderSchema>;
export type SearchData = z.infer<typeof searchSchema>;