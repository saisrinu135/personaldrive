# Implementation Plan: Frontend Setup

## Overview

This implementation plan sets up a Next.js frontend application with TypeScript, Vite, Tailwind CSS, shadcn components, and Axios for API communication. The implementation follows a bottom-up approach: first establishing the foundation (project structure, configuration), then building core services (HTTP client, storage, authentication), and finally wiring everything together with proper error handling and validation.

## Tasks

- [x] 1. Initialize Next.js project with TypeScript and Vite
  - Create frontend/ directory in project root
  - Initialize Next.js project with TypeScript support
  - Configure Vite as the build tool
  - Create package.json with all required dependencies (Next.js, React, TypeScript, Axios, Tailwind CSS, shadcn dependencies)
  - Create tsconfig.json with path aliases (@/*) and strict mode enabled
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Set up project directory structure
  - Create src/ directory with subdirectories: app/, components/, lib/, services/, types/
  - Create public/ directory for static assets
  - Create components/ui/ directory for shadcn components
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 3. Configure Tailwind CSS and shadcn
  - Install Tailwind CSS and its dependencies (autoprefixer, postcss)
  - Create tailwind.config.ts with shadcn presets and CSS variables
  - Create components.json for shadcn configuration
  - Create src/app/globals.css with Tailwind directives and CSS variables
  - Create src/lib/utils.ts with cn() utility function for class merging
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Configure environment variables
  - Create .env.example file with NEXT_PUBLIC_API_URL template
  - Create .env.local file with development API URL (http://localhost:8000)
  - Add .env.local to .gitignore
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 5. Implement TypeScript type definitions
  - [x] 5.1 Create authentication types
    - Create src/types/auth.types.ts with LoginRequest, LoginResponse, RefreshRequest, RefreshResponse, and User interfaces
    - _Requirements: 4.1, 4.2, 4.5, 4.6_
  
  - [x] 5.2 Create user types
    - Create src/types/user.types.ts with RegisterRequest, RegisterResponse, UpdateProfileRequest, ChangePasswordRequest, and User interfaces
    - _Requirements: 5.1, 5.2, 6.2, 6.3_

- [x] 6. Implement token storage service
  - [x] 6.1 Create storage service with token management functions
    - Create src/services/storage.service.ts
    - Implement setAccessToken, setRefreshToken, getAccessToken, getRefreshToken, and clearTokens functions
    - Add browser environment checks (typeof window !== 'undefined')
    - Use localStorage for token persistence
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 6.2 Write property test for token storage round trip
    - **Property 12: Token Storage Round Trip**
    - **Validates: Requirements 9.1, 9.2, 9.3**
    - Test that storing and retrieving tokens returns the same value
  
  - [x] 6.3 Write property test for token clearing completeness
    - **Property 13: Token Clearing Completeness**
    - **Validates: Requirements 9.4**
    - Test that clearTokens removes all tokens from storage

- [x] 7. Implement HTTP client with interceptors
  - [x] 7.1 Create Axios instance with base configuration
    - Create src/lib/axios.ts
    - Configure Axios instance with base URL from environment variables
    - Set default timeout (10000ms) and Content-Type header
    - _Requirements: 3.1, 3.2_
  
  - [x] 7.2 Implement request interceptor for token injection
    - Add request interceptor to inject Authorization header with Bearer token
    - Retrieve access token from storage service
    - _Requirements: 3.3_
  
  - [x] 7.3 Implement response interceptor for token refresh
    - Add response interceptor to handle 401 errors
    - Implement token refresh logic with refresh token
    - Implement request queue to prevent concurrent refresh calls
    - Retry original request after successful token refresh
    - Clear tokens and redirect to /login on refresh failure
    - _Requirements: 3.4, 3.5_
  
  - [x] 7.4 Implement error formatting in response interceptor
    - Format error responses consistently
    - Preserve error details for debugging
    - _Requirements: 3.6_
  
  - [x] 7.5 Write property test for token injection
    - **Property 1: Token Injection in API Requests**
    - **Validates: Requirements 3.3**
    - Test that requests include Authorization header when token exists
  
  - [x] 7.6 Write property test for token refresh on 401
    - **Property 2: Token Refresh on 401 Response**
    - **Validates: Requirements 3.4**
    - Test that 401 responses trigger token refresh attempt
  
  - [x] 7.7 Write property test for consistent error formatting
    - **Property 3: Consistent Error Formatting**
    - **Validates: Requirements 3.6**
    - Test that all API errors are formatted consistently

- [x] 8. Checkpoint - Verify core infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement authentication service
  - [x] 9.1 Create authentication service with login function
    - Create src/services/auth.service.ts
    - Implement login function that calls POST /api/v1/auth/login
    - Store access_token and refresh_token on successful login
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.2 Implement logout function
    - Implement logout function that calls POST /api/v1/auth/logout
    - Clear tokens from storage after logout (even if API call fails)
    - _Requirements: 4.3, 4.4_
  
  - [x] 9.3 Implement token refresh function
    - Implement refreshToken function that calls POST /api/v1/auth/refresh
    - Update stored access token with new token
    - _Requirements: 4.5_
  
  - [x] 9.4 Implement getCurrentUser function
    - Implement getCurrentUser function that calls GET /api/v1/auth/me
    - Return user information
    - _Requirements: 4.6_
  
  - [x] 9.5 Write property test for token storage on login
    - **Property 4: Token Storage on Successful Login**
    - **Validates: Requirements 4.2**
    - Test that successful login stores both tokens
  
  - [x] 9.6 Write property test for token clearing on logout
    - **Property 5: Token Clearing on Logout**
    - **Validates: Requirements 4.4**
    - Test that logout clears all stored tokens

- [x] 10. Implement user registration and profile services
  - [x] 10.1 Create validation helper functions
    - Create src/services/user.service.ts
    - Implement validateEmail function (regex check for email format)
    - Implement validatePassword function (minimum 6 characters)
    - Implement validateName function (2-100 characters)
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 10.2 Implement user registration function
    - Implement register function that calls POST /api/v1/users/register
    - Add client-side validation for email, password, and name
    - Return user data on successful registration
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.3 Implement user profile functions
    - Implement getUserProfile function that calls GET /api/v1/users/profile
    - Implement updateUserProfile function that calls PUT /api/v1/users/profile
    - Only send fields that are provided (partial update)
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 10.4 Implement password change function
    - Implement changePassword function that calls PUT /api/v1/users/change-password
    - Validate that both current_password and new_password are provided
    - Validate new password meets minimum length requirement
    - _Requirements: 6.3, 6.5_
  
  - [x] 10.5 Write property test for registration returns user data
    - **Property 6: Registration Returns User Data**
    - **Validates: Requirements 5.2**
    - Test that successful registration returns user data with id, email, and name
  
  - [x] 10.6 Write property test for email validation
    - **Property 7: Email Validation**
    - **Validates: Requirements 5.3**
    - Test that email validation accepts valid emails and rejects invalid ones
  
  - [x] 10.7 Write property test for password length validation
    - **Property 8: Password Length Validation**
    - **Validates: Requirements 5.4**
    - Test that password validation enforces minimum 6 characters
  
  - [x] 10.8 Write property test for name length validation
    - **Property 9: Name Length Validation**
    - **Validates: Requirements 5.5**
    - Test that name validation enforces 2-100 character range
  
  - [x] 10.9 Write property test for partial profile updates
    - **Property 10: Partial Profile Updates**
    - **Validates: Requirements 6.4**
    - Test that only provided fields are included in update requests
  
  - [x] 10.10 Write property test for password change validation
    - **Property 11: Password Change Validation**
    - **Validates: Requirements 6.5**
    - Test that password change requires both current and new password

- [x] 11. Configure ESLint for code quality
  - Create eslint.config.js with TypeScript and React rules
  - Configure rules for unused variables, explicit any, React hooks
  - Add lint script to package.json
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Create basic Next.js app structure
  - Create src/app/layout.tsx with root layout and global CSS import
  - Create src/app/page.tsx with placeholder home page
  - Verify Next.js app runs with `npm run dev`
  - _Requirements: 1.1, 1.2_

- [ ] 13. Final checkpoint - Verify complete setup
  - Run ESLint to check for code quality issues
  - Verify all configuration files are in place
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → services → integration
- All code uses TypeScript for type safety
- The HTTP client automatically handles authentication and token refresh
- Client-side validation reduces unnecessary API calls
