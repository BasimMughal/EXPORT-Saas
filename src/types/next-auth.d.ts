import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    organizationId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationId?: string | null;
  }
}
