'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function createGroup(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  if (!name || name.trim().length < 2) {
    throw new Error('Название группы должно содержать не менее 2 символов');
  }

  const groupId = randomBytes(4).toString('hex');

  try {
    await db.transaction(async (tx) => {
      // Создаем группу
      await tx.insert(groups).values({
        id: groupId,
        name: name.trim(),
        createdBy: session.user.id,
        isDefault: 'false',
      });

      // Добавляем создателя как администратора группы
      await tx.insert(groupMembers).values({
        groupId,
        userId: session.user.id,
        role: 'admin',
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/groups');
  } catch (error) {
    console.error('Error creating group:', error);
    throw new Error('Failed to create group');
  }
}

export async function joinGroup(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const groupId = formData.get('groupId') as string;
  if (!groupId || groupId.trim().length === 0) {
    throw new Error('ID группы обязателен');
  }

  try {
    // Проверяем, существует ли группа
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId.trim()),
    });

    if (!group) {
      throw new Error('Группа не найдена');
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId.trim()),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (existingMember) {
      throw new Error('Вы уже являетесь участником этой группы');
    }

    // Добавляем пользователя в группу
    await db.insert(groupMembers).values({
      groupId: groupId.trim(),
      userId: session.user.id,
      role: 'member',
    });

    revalidatePath('/dashboard');
    revalidatePath('/groups');
  } catch (error) {
    console.error('Error joining group:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to join group');
  }
}

export async function setDefaultGroup(groupId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Проверяем, является ли пользователь участником группы
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!membership) {
      throw new Error('Вы не являетесь участником этой группы');
    }

    // Убираем флаг дефолтной группы со всех групп пользователя
    await db.update(groups)
      .set({ isDefault: 'false' })
      .where(eq(groups.createdBy, session.user.id));

    // Устанавливаем новую дефолтную группу
    await db.update(groups)
      .set({ isDefault: 'true' })
      .where(eq(groups.id, groupId));

    revalidatePath('/dashboard');
    revalidatePath('/groups');
  } catch (error) {
    console.error('Error setting default group:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to set default group');
  }
}

export async function renameGroup(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const groupId = formData.get('groupId') as string;
  const newName = formData.get('name') as string;

  if (!groupId || !newName || newName.trim().length < 2) {
    throw new Error('Название группы должно содержать не менее 2 символов');
  }

  try {
    // Проверяем, является ли пользователь администратором группы
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.role, 'admin')
      ),
    });

    if (!membership) {
      throw new Error('Только администратор группы может переименовать группу');
    }

    // Обновляем название группы
    await db.update(groups)
      .set({ name: newName.trim() })
      .where(eq(groups.id, groupId));

    revalidatePath('/dashboard');
    revalidatePath('/groups');
  } catch (error) {
    console.error('Error renaming group:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to rename group');
  }
}

