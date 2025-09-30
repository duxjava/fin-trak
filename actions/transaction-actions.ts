'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, groupMembers, accounts, groups } from '@/lib/schema';
import { addTransactionSchema, updateTransactionSchema } from '@/lib/validations';
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
    type: formData.get('type'),
    accountId: parseInt(formData.get('accountId') as string),
  });

  const groupId = formData.get('groupId') as string;

  try {
    let targetGroupId = groupId;

    // Если groupId не передан, используем дефолтную группу
    if (!targetGroupId) {
      const defaultGroup = await db.query.groups.findFirst({
        where: and(
          eq(groups.createdBy, session.user.id),
          eq(groups.isDefault, 'true')
        ),
      });

      if (!defaultGroup) {
        throw new Error('Default group not found');
      }

      targetGroupId = defaultGroup.id;
    } else {
      // Проверяем, что пользователь является участником указанной группы
      const membership = await db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, targetGroupId),
          eq(groupMembers.userId, session.user.id)
        ),
      });

      if (!membership) {
        throw new Error('You are not a member of this group');
      }
    }

    // Проверяем, что счет принадлежит пользователю
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.accountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!account) {
      throw new Error('Account not found or you do not have permission to use it');
    }

    // Создаем транзакцию в указанной группе
    await db.insert(transactions).values({
      amount: validatedData.amount.toString(),
      description: validatedData.description,
      date: new Date(validatedData.date),
      category: validatedData.category,
      type: validatedData.type,
      groupId: targetGroupId,
      accountId: validatedData.accountId,
      userId: session.user.id,
    });

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add transaction');
  }
}

export async function updateTransaction(transactionId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = updateTransactionSchema.parse({
    id: transactionId,
    amount: parseFloat(formData.get('amount') as string),
    description: formData.get('description'),
    date: formData.get('date'),
    category: formData.get('category'),
    type: formData.get('type'),
    accountId: parseInt(formData.get('accountId') as string),
  });

  try {
    // Проверяем, что транзакция принадлежит пользователю
    const existingTransaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, validatedData.id),
        eq(transactions.userId, session.user.id)
      ),
    });

    if (!existingTransaction) {
      throw new Error('Transaction not found or you do not have permission to edit it');
    }

    // Находим дефолтную группу пользователя
    const defaultGroup = await db.query.groups.findFirst({
      where: and(
        eq(groups.createdBy, session.user.id),
        eq(groups.isDefault, 'true')
      ),
    });

    if (!defaultGroup) {
      throw new Error('Default group not found');
    }

    // Проверяем, что счет принадлежит пользователю
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.accountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!account) {
      throw new Error('Account not found or you do not have permission to use it');
    }

    // Обновляем транзакцию в дефолтной группе
    await db.update(transactions)
      .set({
        amount: validatedData.amount.toString(),
        description: validatedData.description,
        date: new Date(validatedData.date),
        category: validatedData.category,
        type: validatedData.type,
        groupId: defaultGroup.id,
        accountId: validatedData.accountId,
      })
      .where(eq(transactions.id, validatedData.id));

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update transaction');
  }
}

export async function deleteTransaction(transactionId: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Проверяем, что транзакция принадлежит пользователю
    const existingTransaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, session.user.id)
      ),
    });

    if (!existingTransaction) {
      throw new Error('Transaction not found or you do not have permission to delete it');
    }

    // Удаляем транзакцию
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete transaction');
  }
}