import { ROLE_PERMISSIONS, type Role } from '@/lib/auth/authorization';

/** Temporary offline demo access — replace with real Mongo users later. */
export const DEMO_ACCOUNT = {
  id: '000000000000000000000001',
  name: 'Basim Admin',
  email: 'demo@exportflow.com',
  password: 'Demo@12345',
  role: 'admin' as Role,
  organizationId: null as string | null,
};

export function isDemoAuthEnabled() {
  return false;
}

export function matchDemoCredentials(email: string, password: string) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
    return null;
  }

  return {
    id: DEMO_ACCOUNT.id,
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    role: DEMO_ACCOUNT.role,
    organizationId: DEMO_ACCOUNT.organizationId,
    permissions: ROLE_PERMISSIONS[DEMO_ACCOUNT.role],
  };
}

export function isDemoUserId(_userId: string | undefined | null) {
  return false;
}
