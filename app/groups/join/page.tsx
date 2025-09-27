import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import JoinGroupForm from '@/components/JoinGroupForm';

export const dynamic = 'force-dynamic';

export default async function JoinGroupPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Join Family Group
                </h1>
                <JoinGroupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
