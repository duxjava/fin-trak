'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { transfers, groupMembers, accounts, groups } from '@/lib/schema';
import { addTransferSchema, updateTransferSchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addTransfer(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = addTransferSchema.parse({
    fromAmount: parseFloat(formData.get('fromAmount') as string),
    toAmount: parseFloat(formData.get('toAmount') as string),
    description: formData.get('description'),
    date: formData.get('date'),
    fromAccountId: parseInt(formData.get('fromAccountId') as string),
    toAccountId: parseInt(formData.get('toAccountId') as string),
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

    // Проверяем, что счет отправления принадлежит пользователю
    const fromAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.fromAccountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!fromAccount) {
      throw new Error('From account not found or you do not have permission to use it');
    }

    // Проверяем, что счет назначения принадлежит пользователю
    const toAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.toAccountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!toAccount) {
      throw new Error('To account not found or you do not have permission to use it');
    }

    if (validatedData.fromAccountId === validatedData.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    // Создаем перевод в указанной группе
    await db.insert(transfers).values({
      fromAmount: validatedData.fromAmount.toString(),
      toAmount: validatedData.toAmount.toString(),
      description: validatedData.description,
      date: new Date(validatedData.date),
      groupId: targetGroupId,
      fromAccountId: validatedData.fromAccountId,
      toAccountId: validatedData.toAccountId,
      userId: session.user.id,
    });

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error adding transfer:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add transfer');
  }
}

export async function updateTransfer(transferId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = updateTransferSchema.parse({
    id: transferId,
    fromAmount: parseFloat(formData.get('fromAmount') as string),
    toAmount: parseFloat(formData.get('toAmount') as string),
    description: formData.get('description'),
    date: formData.get('date'),
    fromAccountId: parseInt(formData.get('fromAccountId') as string),
    toAccountId: parseInt(formData.get('toAccountId') as string),
  });

  try {
    // Проверяем, что перевод принадлежит пользователю
    const existingTransfer = await db.query.transfers.findFirst({
      where: and(
        eq(transfers.id, validatedData.id),
        eq(transfers.userId, session.user.id)
      ),
    });

    if (!existingTransfer) {
      throw new Error('Transfer not found or you do not have permission to edit it');
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

    // Проверяем, что счет отправления принадлежит пользователю
    const fromAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.fromAccountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!fromAccount) {
      throw new Error('From account not found or you do not have permission to use it');
    }

    // Проверяем, что счет назначения принадлежит пользователю
    const toAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.toAccountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!toAccount) {
      throw new Error('To account not found or you do not have permission to use it');
    }

    if (validatedData.fromAccountId === validatedData.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    // Обновляем перевод в дефолтной группе
    await db.update(transfers)
      .set({
        fromAmount: validatedData.fromAmount.toString(),
        toAmount: validatedData.toAmount.toString(),
        description: validatedData.description,
        date: new Date(validatedData.date),
        groupId: defaultGroup.id,
        fromAccountId: validatedData.fromAccountId,
        toAccountId: validatedData.toAccountId,
      })
      .where(eq(transfers.id, validatedData.id));

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error updating transfer:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update transfer');
  }
}

export async function deleteTransfer(transferId: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Проверяем, что перевод принадлежит пользователю
    const existingTransfer = await db.query.transfers.findFirst({
      where: and(
        eq(transfers.id, transferId),
        eq(transfers.userId, session.user.id)
      ),
    });

    if (!existingTransfer) {
      throw new Error('Transfer not found or you do not have permission to delete it');
    }

    // Удаляем перевод
    await db.delete(transfers).where(eq(transfers.id, transferId));

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error deleting transfer:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete transfer');
  }
}
