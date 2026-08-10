import { useAuth } from './AuthContext';

export const ROLES = Object.freeze({
  DEVELOPER: 'DEVELOPER',
  PRO: 'PRO',
  DONATOR: 'DONATOR',
  FREE: 'FREE',
});

export const PERMISSIONS = Object.freeze({
  VIEW_DEVELOPER_OPTIONS: 'VIEW_DEVELOPER_OPTIONS',
  MANAGE_SYSTEM_SETTINGS: 'MANAGE_SYSTEM_SETTINGS',
  MANAGE_USER_TIERS: 'MANAGE_USER_TIERS',
  ACCESS_ADVANCED_MODELS: 'ACCESS_ADVANCED_MODELS',
  ACCESS_BASIC_PRACTICE: 'ACCESS_BASIC_PRACTICE',
});

/**
 * Mapping of Roles to Granted Permissions
 */
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.DEVELOPER]: [
    PERMISSIONS.VIEW_DEVELOPER_OPTIONS,
    PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_USER_TIERS,
    PERMISSIONS.ACCESS_ADVANCED_MODELS,
    PERMISSIONS.ACCESS_BASIC_PRACTICE,
  ],
  [ROLES.PRO]: [
    PERMISSIONS.ACCESS_ADVANCED_MODELS,
    PERMISSIONS.ACCESS_BASIC_PRACTICE,
  ],
  [ROLES.DONATOR]: [
    PERMISSIONS.ACCESS_BASIC_PRACTICE,
  ],
  [ROLES.FREE]: [
    PERMISSIONS.ACCESS_BASIC_PRACTICE,
  ],
});

/**
 * Resolves the role from a profile object, user object, or string.
 * @param {object|string|null} userOrProfile 
 * @returns {string} Normalized role (e.g. 'DEVELOPER', 'PRO', 'DONATOR', 'FREE')
 */
export function getUserRole(userOrProfile) {
  if (!userOrProfile) return ROLES.FREE;

  if (typeof userOrProfile === 'string') {
    const uppercase = userOrProfile.toUpperCase();
    return ROLES[uppercase] || ROLES.FREE;
  }

  // Check Firestore profile fields or Firebase Auth custom claims
  const rawRole =
    userOrProfile.userType ||
    userOrProfile.tier ||
    userOrProfile.role ||
    userOrProfile.customClaims?.userType ||
    ROLES.FREE;

  const normalized = String(rawRole).toUpperCase();
  return ROLES[normalized] || ROLES.FREE;
}

/**
 * Checks if a user/profile has a specific permission.
 * @param {object|string|null} userOrProfile 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(userOrProfile, permission) {
  if (!permission) return false;
  const role = getUserRole(userOrProfile);
  const grantedPermissions = ROLE_PERMISSIONS[role] || [];
  return grantedPermissions.includes(permission);
}

/**
 * Checks if a user/profile matches a required role or one of multiple required roles.
 * @param {object|string|null} userOrProfile 
 * @param {string|string[]} requiredRoles 
 * @returns {boolean}
 */
export function hasRole(userOrProfile, requiredRoles) {
  const currentRole = getUserRole(userOrProfile);
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.map((r) => String(r).toUpperCase()).includes(currentRole);
  }
  return currentRole === String(requiredRoles).toUpperCase();
}

/**
 * Convenience helper to check if a user is a Developer.
 * @param {object|string|null} userOrProfile 
 * @returns {boolean}
 */
export function isDeveloper(userOrProfile) {
  return getUserRole(userOrProfile) === ROLES.DEVELOPER;
}

/**
 * React hook to check permission for current authenticated user profile.
 * @param {string} permission 
 * @returns {boolean}
 */
export function usePermission(permission) {
  const { profile, user } = useAuth();
  return hasPermission(profile || user, permission);
}

/**
 * React hook to check role for current authenticated user profile.
 * @param {string|string[]} requiredRoles 
 * @returns {boolean}
 */
export function useRole(requiredRoles) {
  const { profile, user } = useAuth();
  return hasRole(profile || user, requiredRoles);
}
