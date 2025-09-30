import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CsvImporter from '@/components/CsvImporter';

export default async function ImportPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Импорт данных</h1>
        <p className="text-gray-600 mt-2">
          Загрузите CSV файл с транзакциями для импорта в систему
        </p>
      </div>
      
      <CsvImporter />
    </div>
  );
}




