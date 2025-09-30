import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import SignUpForm from './SignUpForm';

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  return <SignUpForm />;
}