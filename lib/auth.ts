import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// Для NextAuth.js v4 используем getServerSession
import { getServerSession } from 'next-auth/next';

export async function auth() {
  return await getServerSession(authConfig);
}

export const signIn = handler.signIn;
export const signOut = handler.signOut;
