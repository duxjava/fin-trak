import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SignInForm from './SignInForm';

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  return <SignInForm />;
}
