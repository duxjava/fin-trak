'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accounts, groupMembers, groups, currencies } from '@/lib/schema';
import { createAccountSchema, updateAccountSchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createAccount(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = createAccountSchema.parse({
    name: formData.get('name'),
    type: formData.get('type'),
    balance: parseFloat(formData.get('balance') as string) || 0,
    currencyId: parseInt(formData.get('currencyId') as string),
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

    // Создаем счет в указанной группе
    await db.insert(accounts).values({
      name: validatedData.name,
      type: validatedData.type,
      balance: validatedData.balance.toString(),
      currencyId: validatedData.currencyId,
      groupId: targetGroupId,
      userId: session.user.id,
    });

    revalidatePath('/dashboard');
    revalidatePath('/accounts');
  } catch (error) {
    console.error('Error creating account:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create account');
  }
}

export async function updateAccount(accountId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = updateAccountSchema.parse({
    id: accountId,
    name: formData.get('name'),
    type: formData.get('type'),
    balance: parseFloat(formData.get('balance') as string),
    currencyId: parseInt(formData.get('currencyId') as string),
  });

  try {
    // Проверяем, что счет принадлежит пользователю
    const existingAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, validatedData.id),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!existingAccount) {
      throw new Error('Account not found or you do not have permission to edit it');
    }

    // Обновляем счет (groupId остается прежним)
    await db.update(accounts)
      .set({
        name: validatedData.name,
        type: validatedData.type,
        balance: validatedData.balance.toString(),
        currencyId: validatedData.currencyId,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, validatedData.id));

    revalidatePath('/dashboard');
    revalidatePath('/accounts');
  } catch (error) {
    console.error('Error updating account:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update account');
  }
}

export async function deleteAccount(accountId: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Проверяем, что счет принадлежит пользователю
    const existingAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, accountId),
        eq(accounts.userId, session.user.id)
      ),
    });

    if (!existingAccount) {
      throw new Error('Account not found or you do not have permission to delete it');
    }

    // Удаляем счет
    await db.delete(accounts).where(eq(accounts.id, accountId));

    revalidatePath('/dashboard');
    revalidatePath('/accounts');
  } catch (error) {
    console.error('Error deleting account:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete account');
  }
}
