import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn(message) {
      console.log('[SIGNED IN] ', message);
    },
    async signOut(message) {
      console.log('[SIGNED OUT] ', message);
    },
  },
});
