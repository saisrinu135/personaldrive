import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  fileUploadSchema,
  folderSchema,
} from './schemas';

describe('emailSchema', () => {
  it('should validate correct emails', () => {
    expect(() => emailSchema.parse('test@example.com')).not.toThrow();
    expect(() => emailSchema.parse('user.name+tag@domain.co.uk')).not.toThrow();
  });

  it('should reject invalid emails', () => {
    expect(() => emailSchema.parse('')).toThrow();
    expect(() => emailSchema.parse('invalid-email')).toThrow();
    expect(() => emailSchema.parse('@domain.com')).toThrow();
    expect(() => emailSchema.parse('user@')).toThrow();
  });

  it('should reject emails that are too long', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(() => emailSchema.parse(longEmail)).toThrow();
  });
});

describe('passwordSchema', () => {
  it('should validate strong passwords', () => {
    expect(() => passwordSchema.parse('StrongP@ssw0rd')).not.toThrow();
    expect(() => passwordSchema.parse('MySecure123!')).not.toThrow();
  });

  it('should reject weak passwords', () => {
    expect(() => passwordSchema.parse('weak')).toThrow(); // Too short
    expect(() => passwordSchema.parse('nouppercase123!')).toThrow(); // No uppercase
    expect(() => passwordSchema.parse('NOLOWERCASE123!')).toThrow(); // No lowercase
    expect(() => passwordSchema.parse('NoNumbers!')).toThrow(); // No numbers
    expect(() => passwordSchema.parse('NoSpecialChars123')).toThrow(); // No special chars
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'A'.repeat(130) + 'a1!';
    expect(() => passwordSchema.parse(longPassword)).toThrow();
  });
});

describe('nameSchema', () => {
  it('should validate correct names', () => {
    expect(() => nameSchema.parse('John Doe')).not.toThrow();
    expect(() => nameSchema.parse("Mary O'Connor")).not.toThrow();
    expect(() => nameSchema.parse('Jean-Pierre')).not.toThrow();
  });

  it('should reject invalid names', () => {
    expect(() => nameSchema.parse('')).toThrow(); // Empty
    expect(() => nameSchema.parse('A')).toThrow(); // Too short
    expect(() => nameSchema.parse('John123')).toThrow(); // Contains numbers
    expect(() => nameSchema.parse('John@Doe')).toThrow(); // Invalid characters
  });

  it('should reject names that are too long', () => {
    const longName = 'A'.repeat(101);
    expect(() => nameSchema.parse(longName)).toThrow();
  });
});

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'anypassword'
    };
    expect(() => loginSchema.parse(validLogin)).not.toThrow();
  });

  it('should reject invalid login data', () => {
    expect(() => loginSchema.parse({
      email: 'invalid-email',
      password: 'password'
    })).toThrow();

    expect(() => loginSchema.parse({
      email: 'test@example.com',
      password: ''
    })).toThrow();
  });
});

describe('registerSchema', () => {
  it('should validate correct registration data', () => {
    const validRegistration = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongP@ssw0rd',
      confirmPassword: 'StrongP@ssw0rd'
    };
    expect(() => registerSchema.parse(validRegistration)).not.toThrow();
  });

  it('should reject mismatched passwords', () => {
    const mismatchedPasswords = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongP@ssw0rd',
      confirmPassword: 'DifferentP@ssw0rd'
    };
    expect(() => registerSchema.parse(mismatchedPasswords)).toThrow();
  });
});

describe('profileUpdateSchema', () => {
  it('should validate correct profile data', () => {
    const validProfile = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    expect(() => profileUpdateSchema.parse(validProfile)).not.toThrow();
  });
});

describe('passwordChangeSchema', () => {
  it('should validate correct password change data', () => {
    const validPasswordChange = {
      currentPassword: 'OldP@ssw0rd',
      newPassword: 'NewP@ssw0rd',
      confirmPassword: 'NewP@ssw0rd'
    };
    expect(() => passwordChangeSchema.parse(validPasswordChange)).not.toThrow();
  });

  it('should reject when new password matches current password', () => {
    const samePasswords = {
      currentPassword: 'SameP@ssw0rd',
      newPassword: 'SameP@ssw0rd',
      confirmPassword: 'SameP@ssw0rd'
    };
    expect(() => passwordChangeSchema.parse(samePasswords)).toThrow();
  });

  it('should reject when confirmation does not match new password', () => {
    const mismatchedConfirmation = {
      currentPassword: 'OldP@ssw0rd',
      newPassword: 'NewP@ssw0rd',
      confirmPassword: 'DifferentP@ssw0rd'
    };
    expect(() => passwordChangeSchema.parse(mismatchedConfirmation)).toThrow();
  });
});

describe('fileUploadSchema', () => {
  it('should validate correct file data', () => {
    const validFile = {
      name: 'document.pdf',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf'
    };
    expect(() => fileUploadSchema.parse(validFile)).not.toThrow();
  });

  it('should reject files that are too large', () => {
    const largeFile = {
      name: 'large.pdf',
      size: 200 * 1024 * 1024, // 200MB
      type: 'application/pdf'
    };
    expect(() => fileUploadSchema.parse(largeFile)).toThrow();
  });

  it('should reject empty files', () => {
    const emptyFile = {
      name: 'empty.txt',
      size: 0,
      type: 'text/plain'
    };
    expect(() => fileUploadSchema.parse(emptyFile)).toThrow();
  });
});

describe('folderSchema', () => {
  it('should validate correct folder names', () => {
    expect(() => folderSchema.parse({ name: 'Documents' })).not.toThrow();
    expect(() => folderSchema.parse({ name: 'My Folder' })).not.toThrow();
  });

  it('should reject invalid folder names', () => {
    expect(() => folderSchema.parse({ name: '' })).toThrow(); // Empty
    expect(() => folderSchema.parse({ name: 'folder/with/slash' })).toThrow(); // Invalid chars
    expect(() => folderSchema.parse({ name: 'folder:with:colon' })).toThrow(); // Invalid chars
    expect(() => folderSchema.parse({ name: 'A'.repeat(101) })).toThrow(); // Too long
  });
});