import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../schemas';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = loginSchema.validate({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    it('should reject short password', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com',
        password: 'short',
      });
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const { error } = loginSchema.validate({
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const { error } = loginSchema.validate({
        email: 'test@example.com',
      });
      expect(error).toBeDefined();
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(error).toBeUndefined();
    });

    it('should accept optional role', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'admin',
      });
      expect(error).toBeUndefined();
    });

    it('should accept optional phone', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890',
      });
      expect(error).toBeUndefined();
    });

    it('should reject short name', () => {
      const { error } = registerSchema.validate({
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    it('should reject long name', () => {
      const { error } = registerSchema.validate({
        name: 'a'.repeat(101),
        email: 'john@example.com',
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      });
      expect(error).toBeDefined();
    });

    it('should reject short password', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid role', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role',
      });
      expect(error).toBeDefined();
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate correct password change', () => {
      const { error } = changePasswordSchema.validate({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing current password', () => {
      const { error } = changePasswordSchema.validate({
        newPassword: 'newpass123',
      });
      expect(error).toBeDefined();
    });

    it('should reject missing new password', () => {
      const { error } = changePasswordSchema.validate({
        currentPassword: 'oldpass123',
      });
      expect(error).toBeDefined();
    });

    it('should reject short new password', () => {
      const { error } = changePasswordSchema.validate({
        currentPassword: 'oldpass123',
        newPassword: 'short',
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate with all optional fields', () => {
      const { error } = updateProfileSchema.validate({
        name: 'Updated Name',
        phone: '+1234567890',
        fcmToken: 'token123',
      });
      expect(error).toBeUndefined();
    });

    it('should validate with partial fields', () => {
      const { error } = updateProfileSchema.validate({
        name: 'Updated Name',
      });
      expect(error).toBeUndefined();
    });

    it('should validate with empty object', () => {
      const { error } = updateProfileSchema.validate({});
      expect(error).toBeUndefined();
    });

    it('should accept only name', () => {
      const { error } = updateProfileSchema.validate({
        name: 'New Name',
      });
      expect(error).toBeUndefined();
    });

    it('should accept only phone', () => {
      const { error } = updateProfileSchema.validate({
        phone: '+9876543210',
      });
      expect(error).toBeUndefined();
    });

    it('should accept only fcmToken', () => {
      const { error } = updateProfileSchema.validate({
        fcmToken: 'new-token',
      });
      expect(error).toBeUndefined();
    });
  });
});
