import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except static files and API routes we don't want to protect
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
