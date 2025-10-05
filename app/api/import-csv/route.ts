import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { importCsvData, previewCsvData, validateCsvFile } from '@/lib/csv-importer';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string; // 'preview' или 'import'

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Поддерживаются только CSV файлы' }, { status: 400 });
    }

    const csvContent = await file.text();

    // Валидация файла
    const validation = validateCsvFile(csvContent);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Файл не прошел валидацию',
        details: validation.errors,
        warnings: validation.warnings
      }, { status: 400 });
    }

    if (action === 'preview') {
      // Предварительный просмотр
      const preview = previewCsvData(csvContent);
      return NextResponse.json({
        success: true,
        preview,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        }
      });
    }

    if (action === 'import') {
      // Получение дефолтной группы пользователя
      const userGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.createdBy, session.user.id));

      const defaultGroup = userGroups.find(group => group.isDefault === 'true');
      if (!defaultGroup) {
        return NextResponse.json({ error: 'Дефолтная группа не найдена' }, { status: 400 });
      }

      // Импорт данных
      const importResult = await importCsvData(
        csvContent,
        session.user.id,
        defaultGroup.id
      );

      return NextResponse.json({
        success: importResult.success,
        result: importResult
      });
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });

  } catch (error) {
    console.error('Ошибка импорта CSV:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}





