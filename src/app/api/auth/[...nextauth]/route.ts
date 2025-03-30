import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/prisma';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', required: true },
        password: { label: 'Password', type: 'password', required: true },
      },
      async authorize(credentials) {
        // if (!credentials?.username || !credentials?.password) {
        //   throw new Error('Missing credentials');
        // }

        // const user = await prisma.user.findUnique({
        //   where: {
        //     username: credentials.username,
        //   },
        // });

        // if (!user) {
        //   throw new Error('User not found');
        // }

        // const isValid = await compare(credentials.password, user.password);

        // if (!isValid) {
        //   throw new Error('Invalid password');
        // }

        //TODO: Implement your own logic here
        const user = { id: '1', username: 'kempo', password: '1234' };

        if (
          credentials?.username !== user.username ||
          credentials?.password !== user.password
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  // pages: {
  //   signIn: '/auth/signin',
  // },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn(message) {
      console.log('Signed in ', message);
    },
    async signOut(message) {
      console.log('Signed out ', message);
    },
  },
});

export { handler as GET, handler as POST };
