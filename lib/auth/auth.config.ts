import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/user') || nextUrl.pathname.startsWith('/admin');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      } else if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/user', nextUrl));
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullName = user.fullName;
        token.status = user.status;
        token.jabatan = user.jabatan;
        token.divisionScope = user.divisionScope;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.fullName = token.fullName as string;
        session.user.status = token.status as string;
        session.user.jabatan = token.jabatan as string | null;
        session.user.divisionScope = token.divisionScope as string | null;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { username, password } = validatedFields.data;

        const user = await db.user.findUnique({
          where: { username },
          select: {
            id: true,
            username: true,
            passwordHash: true,
            fullName: true,
            status: true,
            jabatan: true,
            divisionScope: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          status: user.status,
          jabatan: user.jabatan,
          divisionScope: user.divisionScope,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
