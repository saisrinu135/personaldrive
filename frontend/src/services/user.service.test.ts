import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { changePassword, register, validateEmail, validatePassword, validateName, updateUserProfile } from './user.service';
import axiosInstance from '@/lib/axios';

// Mock the axios instance
vi.mock('@/lib/axios');

describe('changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully change password with valid data', async () => {
    const mockData = {
      current_password: 'oldPassword123',
      new_password: 'newPassword456',
    };

    vi.mocked(axiosInstance.put).mockResolvedValue({ data: {} });

    await changePassword(mockData);

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/v1/users/change-password', mockData);
  });

  it('should throw error when current_password is missing', async () => {
    const mockData = {
      current_password: '',
      new_password: 'newPassword456',
    };

    await expect(changePassword(mockData)).rejects.toThrow(
      'Both current password and new password are required'
    );
  });

  it('should throw error when new_password is missing', async () => {
    const mockData = {
      current_password: 'oldPassword123',
      new_password: '',
    };

    await expect(changePassword(mockData)).rejects.toThrow(
      'Both current password and new password are required'
    );
  });

  it('should throw error when new password is less than 6 characters', async () => {
    const mockData = {
      current_password: 'oldPassword123',
      new_password: '12345',
    };

    await expect(changePassword(mockData)).rejects.toThrow(
      'New password must be at least 6 characters'
    );
  });

  it('should accept new password with exactly 6 characters', async () => {
    const mockData = {
      current_password: 'oldPassword123',
      new_password: '123456',
    };

    vi.mocked(axiosInstance.put).mockResolvedValue({ data: {} });

    await changePassword(mockData);

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/v1/users/change-password', mockData);
  });
});

/**
 * Property 6: Registration Returns User Data
 * **Validates: Requirements 5.2**
 * 
 * For any valid registration request that succeeds, the registration function
 * should return user data containing at least the user's id, email, and name.
 */
describe('Property 6: Registration Returns User Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user data with id, email, and name on successful registration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 6 }),
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.uuid(),
        fc.date(),
        async (email, password, name, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful registration response
          const mockResponse = {
            data: {
              id: userId,
              email: email,
              name: name,
              created_at: createdAt.toISOString(),
            },
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

          // Call register function
          const result = await register({ email, password, name });

          // Verify the result contains required fields
          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('email');
          expect(result).toHaveProperty('name');
          expect(result.id).toBe(userId);
          expect(result.email).toBe(email);
          expect(result.name).toBe(name);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return user data with created_at timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 6 }),
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.uuid(),
        fc.date(),
        async (email, password, name, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful registration response
          const mockResponse = {
            data: {
              id: userId,
              email: email,
              name: name,
              created_at: createdAt.toISOString(),
            },
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

          // Call register function
          const result = await register({ email, password, name });

          // Verify the result contains created_at field
          expect(result).toHaveProperty('created_at');
          expect(result.created_at).toBe(createdAt.toISOString());
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should preserve exact values from backend response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 6 }),
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.uuid(),
        fc.date(),
        async (email, password, name, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful registration response
          const mockResponse = {
            data: {
              id: userId,
              email: email,
              name: name,
              created_at: createdAt.toISOString(),
            },
          };

          vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

          // Call register function
          const result = await register({ email, password, name });

          // Verify the result exactly matches the backend response
          expect(result).toEqual(mockResponse.data);
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Property 7: Email Validation
 * **Validates: Requirements 5.3**
 * 
 * For any string, the email validation function should accept strings matching
 * the email format (containing @ and domain) and reject strings that don't match this format.
 */
describe('Property 7: Email Validation', () => {
  it('should accept valid email addresses', async () => {
    await fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const result = validateEmail(email);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject strings without @ symbol', async () => {
    await fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (invalidEmail) => {
          const result = validateEmail(invalidEmail);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject strings without domain (no dot after @)', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).map(s => s.replace(/[@.]/g, '') + '@' + s.replace(/[@.]/g, '')),
        (invalidEmail) => {
          // Only test if the string doesn't accidentally have a dot
          if (!invalidEmail.includes('.')) {
            const result = validateEmail(invalidEmail);
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject empty strings', () => {
    const result = validateEmail('');
    expect(result).toBe(false);
  });

  it('should reject strings with only whitespace', async () => {
    await fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === '' && s.length > 0),
        (whitespaceString) => {
          const result = validateEmail(whitespaceString);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject strings with whitespace in email', async () => {
    await fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.nat({ max: 10 }),
        (email, spaceCount) => {
          // Insert spaces into the email
          const emailWithSpaces = email.slice(0, email.length / 2) + ' '.repeat(spaceCount + 1) + email.slice(email.length / 2);
          const result = validateEmail(emailWithSpaces);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should accept emails with various valid formats', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('.') && !/\s/.test(s)),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('.') && !/\s/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes('@') && !s.includes('.') && !/\s/.test(s)),
        (localPart, domain, tld) => {
          const email = `${localPart}@${domain}.${tld}`;
          const result = validateEmail(email);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });
});

/**
 * Property 8: Password Length Validation
 * **Validates: Requirements 5.4**
 * 
 * For any string, the password validation function should reject passwords with
 * fewer than 6 characters and accept passwords with 6 or more characters.
 */
describe('Property 8: Password Length Validation', () => {
  it('should reject passwords with fewer than 6 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ maxLength: 5 }),
        (password) => {
          const result = validatePassword(password);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should accept passwords with exactly 6 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 6 }),
        (password) => {
          const result = validatePassword(password);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should accept passwords with more than 6 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 7, maxLength: 100 }),
        (password) => {
          const result = validatePassword(password);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should accept passwords with 6 or more characters (combined test)', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 6 }),
        (password) => {
          const result = validatePassword(password);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle empty string (edge case)', () => {
    const result = validatePassword('');
    expect(result).toBe(false);
  });

  it('should handle boundary case: 5 characters', () => {
    const result = validatePassword('12345');
    expect(result).toBe(false);
  });

  it('should handle boundary case: 6 characters', () => {
    const result = validatePassword('123456');
    expect(result).toBe(true);
  });

  it('should validate based on length regardless of content', async () => {
    await fc.assert(
      fc.property(
        fc.nat({ max: 20 }),
        fc.constantFrom('a', 'b', 'c', '1', '2', '!', '@', '#'),
        (length, char) => {
          const password = char.repeat(length);
          const result = validatePassword(password);
          const expected = length >= 6;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 15 }
    );
  });
});

/**
 * Property 9: Name Length Validation
 * **Validates: Requirements 5.5**
 * 
 * For any string, the name validation function should reject names with fewer
 * than 2 characters or more than 100 characters, and accept names within this range.
 */
describe('Property 9: Name Length Validation', () => {
  it('should reject names with fewer than 2 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ maxLength: 1 }),
        (name) => {
          const result = validateName(name);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject names with more than 100 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (name) => {
          const result = validateName(name);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should accept names with exactly 2 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 2 }),
        (name) => {
          const result = validateName(name);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should accept names with exactly 100 characters', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 100, maxLength: 100 }),
        (name) => {
          const result = validateName(name);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should accept names within the 2-100 character range', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        (name) => {
          const result = validateName(name);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle empty string (edge case)', () => {
    const result = validateName('');
    expect(result).toBe(false);
  });

  it('should handle boundary case: 1 character', () => {
    const result = validateName('A');
    expect(result).toBe(false);
  });

  it('should handle boundary case: 2 characters', () => {
    const result = validateName('AB');
    expect(result).toBe(true);
  });

  it('should handle boundary case: 100 characters', () => {
    const result = validateName('A'.repeat(100));
    expect(result).toBe(true);
  });

  it('should handle boundary case: 101 characters', () => {
    const result = validateName('A'.repeat(101));
    expect(result).toBe(false);
  });

  it('should validate based on length regardless of content', async () => {
    await fc.assert(
      fc.property(
        fc.nat({ max: 150 }),
        fc.constantFrom('a', 'b', 'c', '1', '2', ' ', '-', '.'),
        (length, char) => {
          const name = char.repeat(length);
          const result = validateName(name);
          const expected = length >= 2 && length <= 100;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 15 }
    );
  });
});

/**
 * Property 10: Partial Profile Updates
 * **Validates: Requirements 6.4**
 * 
 * For any profile update request, only the fields that are explicitly provided
 * (not undefined) should be included in the API request payload.
 */
describe('Property 10: Partial Profile Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only include name field when only name is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.uuid(),
        fc.emailAddress(),
        fc.date(),
        async (name, userId, userEmail, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: userEmail,
              name: name,
              created_at: createdAt.toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile with only name
          await updateUserProfile({ name });

          // Verify that only name was sent in the request
          expect(axiosInstance.put).toHaveBeenCalledWith(
            '/api/v1/users/profile',
            { name }
          );
          
          // Verify email was NOT included in the payload
          const callArgs = vi.mocked(axiosInstance.put).mock.calls[0];
          expect(callArgs[1]).not.toHaveProperty('email');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should only include email field when only email is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.date(),
        async (email, userId, userName, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: email,
              name: userName,
              created_at: createdAt.toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile with only email
          await updateUserProfile({ email });

          // Verify that only email was sent in the request
          expect(axiosInstance.put).toHaveBeenCalledWith(
            '/api/v1/users/profile',
            { email }
          );
          
          // Verify name was NOT included in the payload
          const callArgs = vi.mocked(axiosInstance.put).mock.calls[0];
          expect(callArgs[1]).not.toHaveProperty('name');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should include both fields when both name and email are provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 100 }),
        fc.emailAddress(),
        fc.uuid(),
        fc.date(),
        async (name, email, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: email,
              name: name,
              created_at: createdAt.toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile with both fields
          await updateUserProfile({ name, email });

          // Verify that both fields were sent in the request
          expect(axiosInstance.put).toHaveBeenCalledWith(
            '/api/v1/users/profile',
            { name, email }
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should send empty object when no fields are provided', async () => {
    vi.clearAllMocks();
    
    // Mock successful update response
    const mockResponse = {
      data: {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

    // Call updateUserProfile with empty object
    await updateUserProfile({});

    // Verify that an empty object was sent
    expect(axiosInstance.put).toHaveBeenCalledWith(
      '/api/v1/users/profile',
      {}
    );
  });

  it('should not include undefined fields in the request payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: undefined }),
        fc.option(fc.emailAddress(), { nil: undefined }),
        fc.uuid(),
        fc.date(),
        async (name, email, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: email || 'existing@example.com',
              name: name || 'Existing Name',
              created_at: createdAt.toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile with potentially undefined fields
          await updateUserProfile({ name, email });

          // Get the actual payload sent
          const callArgs = vi.mocked(axiosInstance.put).mock.calls[0];
          const payload = callArgs[1];

          // Verify that undefined fields are not in the payload
          if (name === undefined) {
            expect(payload).not.toHaveProperty('name');
          } else {
            expect(payload).toHaveProperty('name', name);
          }

          if (email === undefined) {
            expect(payload).not.toHaveProperty('email');
          } else {
            expect(payload).toHaveProperty('email', email);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve field values exactly as provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: undefined }),
        fc.option(fc.emailAddress(), { nil: undefined }),
        fc.uuid(),
        async (name, email, userId) => {
          // Skip if both are undefined
          if (name === undefined && email === undefined) {
            return;
          }

          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: email || 'existing@example.com',
              name: name || 'Existing Name',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile
          await updateUserProfile({ name, email });

          // Get the actual payload sent
          const callArgs = vi.mocked(axiosInstance.put).mock.calls[0];
          const payload = callArgs[1];

          // Verify that provided values are preserved exactly
          if (name !== undefined) {
            expect(payload.name).toBe(name);
          }

          if (email !== undefined) {
            expect(payload.email).toBe(email);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only send fields that are not undefined (comprehensive test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: undefined }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
        }),
        fc.uuid(),
        fc.date(),
        async (updateData, userId, createdAt) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Mock successful update response
          const mockResponse = {
            data: {
              id: userId,
              email: updateData.email || 'existing@example.com',
              name: updateData.name || 'Existing Name',
              created_at: createdAt.toISOString(),
              updated_at: new Date().toISOString(),
            },
          };

          vi.mocked(axiosInstance.put).mockResolvedValueOnce(mockResponse);

          // Call updateUserProfile
          await updateUserProfile(updateData);

          // Get the actual payload sent
          const callArgs = vi.mocked(axiosInstance.put).mock.calls[0];
          const payload = callArgs[1];

          // Count how many fields are defined in the input
          const definedFields = Object.keys(updateData).filter(
            key => updateData[key as keyof typeof updateData] !== undefined
          );

          // Verify that the payload only contains defined fields
          expect(Object.keys(payload).length).toBe(definedFields.length);

          // Verify each defined field is in the payload
          definedFields.forEach(field => {
            expect(payload).toHaveProperty(field);
            expect(payload[field as keyof typeof payload]).toBe(
              updateData[field as keyof typeof updateData]
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11: Password Change Validation
 * **Validates: Requirements 6.5**
 * 
 * For any password change request, if either the current password or new password
 * is missing, the function should reject the request with an error.
 */
describe('Property 11: Password Change Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject when current_password is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6 }),
        fc.constantFrom('', undefined, null),
        async (newPassword, currentPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const data = {
            current_password: currentPassword as string,
            new_password: newPassword,
          };

          // Should throw error for missing current password
          await expect(changePassword(data)).rejects.toThrow(
            'Both current password and new password are required'
          );

          // Verify axios was NOT called
          expect(axiosInstance.put).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject when new_password is missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6 }),
        fc.constantFrom('', undefined, null),
        async (currentPassword, newPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const data = {
            current_password: currentPassword,
            new_password: newPassword as string,
          };

          // Should throw error for missing new password
          await expect(changePassword(data)).rejects.toThrow(
            'Both current password and new password are required'
          );

          // Verify axios was NOT called
          expect(axiosInstance.put).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject when both passwords are missing or empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('', undefined, null),
        fc.constantFrom('', undefined, null),
        async (currentPassword, newPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const data = {
            current_password: currentPassword as string,
            new_password: newPassword as string,
          };

          // Should throw error for missing passwords
          await expect(changePassword(data)).rejects.toThrow(
            'Both current password and new password are required'
          );

          // Verify axios was NOT called
          expect(axiosInstance.put).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should accept when both passwords are provided and valid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 50 }),
        fc.string({ minLength: 6, maxLength: 50 }),
        async (currentPassword, newPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          // Mock successful password change
          vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: {} });

          const data = {
            current_password: currentPassword,
            new_password: newPassword,
          };

          // Should not throw error
          await changePassword(data);

          // Verify axios was called with correct data
          expect(axiosInstance.put).toHaveBeenCalledWith(
            '/api/v1/users/change-password',
            data
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should validate new password meets minimum length requirement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        async (currentPassword, shortNewPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const data = {
            current_password: currentPassword,
            new_password: shortNewPassword,
          };

          // Should throw error for short new password
          await expect(changePassword(data)).rejects.toThrow(
            'New password must be at least 6 characters'
          );

          // Verify axios was NOT called
          expect(axiosInstance.put).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should require both passwords regardless of their content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 6 }), { nil: undefined }),
        fc.option(fc.string({ minLength: 6 }), { nil: undefined }),
        async (currentPassword, newPassword) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const data = {
            current_password: currentPassword as string,
            new_password: newPassword as string,
          };

          // If either password is missing
          if (!currentPassword || !newPassword) {
            // Should throw error
            await expect(changePassword(data)).rejects.toThrow(
              'Both current password and new password are required'
            );

            // Verify axios was NOT called
            expect(axiosInstance.put).not.toHaveBeenCalled();
          } else {
            // Mock successful password change
            vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: {} });

            // Should succeed
            await changePassword(data);

            // Verify axios was called
            expect(axiosInstance.put).toHaveBeenCalledWith(
              '/api/v1/users/change-password',
              data
            );
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should enforce validation before making API call', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          current_password: fc.option(fc.string(), { nil: undefined }),
          new_password: fc.option(fc.string(), { nil: undefined }),
        }),
        async (data) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          const hasCurrentPassword = data.current_password && data.current_password.length > 0;
          const hasNewPassword = data.new_password && data.new_password.length > 0;
          const newPasswordValid = hasNewPassword && data.new_password!.length >= 6;

          if (!hasCurrentPassword || !hasNewPassword) {
            // Should throw error for missing passwords
            await expect(changePassword(data as ChangePasswordRequest)).rejects.toThrow(
              'Both current password and new password are required'
            );
            expect(axiosInstance.put).not.toHaveBeenCalled();
          } else if (!newPasswordValid) {
            // Should throw error for invalid new password length
            await expect(changePassword(data as ChangePasswordRequest)).rejects.toThrow(
              'New password must be at least 6 characters'
            );
            expect(axiosInstance.put).not.toHaveBeenCalled();
          } else {
            // Mock successful password change
            vi.mocked(axiosInstance.put).mockResolvedValueOnce({ data: {} });

            // Should succeed
            await changePassword(data as ChangePasswordRequest);

            // Verify axios was called
            expect(axiosInstance.put).toHaveBeenCalledWith(
              '/api/v1/users/change-password',
              data
            );
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});
