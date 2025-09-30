import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// Для NextAuth.js v4 используем getServerSession
import { getServerSession } from 'next-auth/next';

export async function auth() {
  return await getServerSession(authConfig);
}

export async function signOut() {
  // Для server actions нужно использовать cookies
  const { cookies } = await import('next/headers');
  
  // Очищаем все NextAuth куки
  const cookieStore = cookies();
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ];
  
  for (const cookieName of cookieNames) {
    cookieStore.set(cookieName, '', { 
      expires: new Date(0),
      path: '/'
    });
  }
}
