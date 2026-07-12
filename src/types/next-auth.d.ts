import type { DefaultSession } from 'next-auth';

import type { Permission, Role } from '@/lib/auth/authorization';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string | null;
      permissions: Permission[];
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
    organizationId: string | null;
    permissions: Permission[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    organizationId?: string | null;
    permissions?: Permission[];
  }
}
