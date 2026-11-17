import { describe, it, expect } from 'vitest';
import { AuthService } from '../src/services/matrix/authService';

describe('Authentication & Password Complexity Policy', () => {
  it('rejects passwords shorter than 10 characters', () => {
    const res = AuthService.validatePasswordComplexity('Pass1!');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('at least 10 characters');
  });

  it('rejects passwords without uppercase letters', () => {
    const res = AuthService.validatePasswordComplexity('password123!@#');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('uppercase');
  });

  it('rejects passwords without numbers', () => {
    const res = AuthService.validatePasswordComplexity('PasswordSpecial!');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('digit');
  });

  it('rejects passwords without special symbols', () => {
    const res = AuthService.validatePasswordComplexity('Password123456');
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain('special symbol');
  });

  it('accepts strong, compliant passwords', () => {
    const res = AuthService.validatePasswordComplexity('CipherChat3.0@SecurePass!');
    expect(res.isValid).toBe(true);
    expect(res.reason).toBeUndefined();
  });
});
