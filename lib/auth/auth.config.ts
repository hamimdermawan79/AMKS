import type { NextAuthConfig } from 'next-auth';

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
  providers: [],
} satisfies NextAuthConfig;

