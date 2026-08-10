import { describe, it, expect } from 'vitest';
import { ROLES, PERMISSIONS, getUserRole, hasPermission, hasRole, isDeveloper } from './rbac';

describe('RBAC (Role Based Access Control)', () => {
  describe('getUserRole', () => {
    it('returns FREE when input is null or undefined', () => {
      expect(getUserRole(null)).toBe(ROLES.FREE);
      expect(getUserRole(undefined)).toBe(ROLES.FREE);
    });

    it('parses string roles correctly', () => {
      expect(getUserRole('developer')).toBe(ROLES.DEVELOPER);
      expect(getUserRole('DEVELOPER')).toBe(ROLES.DEVELOPER);
      expect(getUserRole('pro')).toBe(ROLES.PRO);
      expect(getUserRole('unknown_role')).toBe(ROLES.FREE);
    });

    it('extracts role from profile userType or tier', () => {
      expect(getUserRole({ userType: 'DEVELOPER' })).toBe(ROLES.DEVELOPER);
      expect(getUserRole({ tier: 'PRO' })).toBe(ROLES.PRO);
      expect(getUserRole({ role: 'DONATOR' })).toBe(ROLES.DONATOR);
      expect(getUserRole({ customClaims: { userType: 'DEVELOPER' } })).toBe(ROLES.DEVELOPER);
    });
  });

  describe('hasPermission', () => {
    it('grants VIEW_DEVELOPER_OPTIONS only to DEVELOPER role', () => {
      expect(hasPermission({ userType: 'DEVELOPER' }, PERMISSIONS.VIEW_DEVELOPER_OPTIONS)).toBe(true);
      expect(hasPermission({ userType: 'PRO' }, PERMISSIONS.VIEW_DEVELOPER_OPTIONS)).toBe(false);
      expect(hasPermission({ userType: 'FREE' }, PERMISSIONS.VIEW_DEVELOPER_OPTIONS)).toBe(false);
      expect(hasPermission(null, PERMISSIONS.VIEW_DEVELOPER_OPTIONS)).toBe(false);
    });

    it('grants ACCESS_BASIC_PRACTICE to all roles', () => {
      expect(hasPermission({ userType: 'DEVELOPER' }, PERMISSIONS.ACCESS_BASIC_PRACTICE)).toBe(true);
      expect(hasPermission({ userType: 'PRO' }, PERMISSIONS.ACCESS_BASIC_PRACTICE)).toBe(true);
      expect(hasPermission({ userType: 'FREE' }, PERMISSIONS.ACCESS_BASIC_PRACTICE)).toBe(true);
    });

    it('grants ACCESS_ADVANCED_MODELS to PRO and DEVELOPER only', () => {
      expect(hasPermission({ userType: 'DEVELOPER' }, PERMISSIONS.ACCESS_ADVANCED_MODELS)).toBe(true);
      expect(hasPermission({ userType: 'PRO' }, PERMISSIONS.ACCESS_ADVANCED_MODELS)).toBe(true);
      expect(hasPermission({ userType: 'FREE' }, PERMISSIONS.ACCESS_ADVANCED_MODELS)).toBe(false);
    });
  });

  describe('hasRole & isDeveloper', () => {
    it('verifies developer role', () => {
      expect(isDeveloper({ userType: 'DEVELOPER' })).toBe(true);
      expect(isDeveloper({ userType: 'FREE' })).toBe(false);
    });

    it('checks single or array of required roles', () => {
      expect(hasRole({ userType: 'DEVELOPER' }, 'DEVELOPER')).toBe(true);
      expect(hasRole({ userType: 'PRO' }, ['DEVELOPER', 'PRO'])).toBe(true);
      expect(hasRole({ userType: 'FREE' }, ['DEVELOPER', 'PRO'])).toBe(false);
    });
  });
});
