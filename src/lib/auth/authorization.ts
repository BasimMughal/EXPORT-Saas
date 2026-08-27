export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'dashboard:view',
  'auth:manage',
  'settings:manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['dashboard:view', 'auth:manage', 'settings:manage'],
  admin: ['dashboard:view', 'auth:manage', 'settings:manage'],
  member: ['dashboard:view', 'auth:manage', 'settings:manage'],
  viewer: ['dashboard:view', 'auth:manage', 'settings:manage'],
};

export function hasPermission(role: Role, permission: Permission) {
  return (ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.admin).includes(permission);
}
