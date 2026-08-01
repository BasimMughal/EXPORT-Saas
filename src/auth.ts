import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Types } from 'mongoose';

import { env } from '@/env';
import { ROLE_PERMISSIONS, type Role } from '@/lib/auth/authorization';
import { matchDemoCredentials } from '@/lib/auth/demo';
import { verifyPassword } from '@/lib/auth/password';
import { connectMongoose } from '@/lib/db/mongoose';
import { signInSchema } from '@/lib/validations/auth';
import { UserModel } from '@/models/user.model';

type AuthUserRecord = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  organizationId: Types.ObjectId | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST ?? true,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: '/sign-in',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const demoUser = matchDemoCredentials(parsed.data.email, parsed.data.password);
        if (demoUser) {
          return demoUser;
        }

        try {
          await connectMongoose();
        } catch {
          return null;
        }

        const user = (await UserModel.findOne({
          email: parsed.data.email.toLowerCase(),
          status: 'active',
        })
          .select('+passwordHash')
          .lean()) as AuthUserRecord | null;

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        await UserModel.updateOne(
          { _id: user._id },
          {
            $set: {
              lastLoginAt: new Date(),
            },
          },
        );

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as Role,
          organizationId: user.organizationId ? user.organizationId.toString() : null,
          permissions: ROLE_PERMISSIONS[user.role as Role],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.permissions = user.permissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = (token.role ?? 'viewer') as Role;
        session.user.organizationId = token.organizationId ?? null;
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },
  },
});
