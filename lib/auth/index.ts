import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
            roles: {
              include: {
                role: true,
              },
            },
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
          jabatan: user.jabatan || user.roles.map(r => {
            if (r.role.name === 'DIVISION_HEAD' && user.divisionScope) {
              return `${r.role.label} ${user.divisionScope}`;
            }
            return r.role.label;
          }).join(', ') || null,
          divisionScope: user.divisionScope,
        };
      },
    }),
  ],
});

