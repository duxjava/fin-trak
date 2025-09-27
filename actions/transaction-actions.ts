'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, groupMembers } from '@/lib/schema';
import { addTransactionSchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addTransaction(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = addTransactionSchema.parse({
    amount: parseFloat(formData.get('amount') as string),
    description: formData.get('description'),
    date: formData.get('date'),
    category: formData.get('category'),
    groupId: formData.get('groupId'),
  });

  try {
    // Проверяем, является ли пользователь участником группы
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, validatedData.groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!membership) {
      throw new Error('You are not a member of this group');
    }

    // Создаем транзакцию
    await db.insert(transactions).values({
      amount: validatedData.amount,
      description: validatedData.description,
      date: new Date(validatedData.date),
      category: validatedData.category,
      groupId: validatedData.groupId,
      userId: session.user.id,
    });

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add transaction');
  }
}