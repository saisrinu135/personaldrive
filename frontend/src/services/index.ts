// Service layer exports
export * from './auth.service';
export * from './file.service';
export * from './provider.service';
export * from './storage.service';

// User service exports with renamed register to avoid conflict
export { 
  validateEmail, 
  validatePassword, 
  validateName, 
  register as userRegister,
  getUserProfile,
  updateUserProfile,
  changePassword 
} from './user.service';
