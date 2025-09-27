import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    const session = await auth();
    
    if (session?.user) {
      redirect('/dashboard');
    } else {
      redirect('/sign-in');
    }
  } catch (error) {
    // Если есть ошибка с аутентификацией, перенаправляем на страницу входа
    redirect('/sign-in');
  }
}
