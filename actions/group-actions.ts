'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/schema';
import { createGroupSchema, joinGroupSchema } from '@/lib/validations';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function createGroup(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = createGroupSchema.parse({
    name: formData.get('name'),
  });

  const groupId = randomBytes(4).toString('hex');

  try {
    await db.transaction(async (tx) => {
      // Создаем группу
      await tx.insert(groups).values({
        id: groupId,
        name: validatedData.name,
        createdBy: session.user.id,
      });

      // Добавляем создателя как администратора группы
      await tx.insert(groupMembers).values({
        groupId,
        userId: session.user.id,
        role: 'admin',
      });
    });

    revalidatePath('/dashboard');
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

  const validatedData = joinGroupSchema.parse({
    groupId: formData.get('groupId'),
  });

  try {
    // Проверяем, существует ли группа
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, validatedData.groupId),
    });

    if (!group) {
      throw new Error('Group not found');
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, validatedData.groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (existingMember) {
      throw new Error('You are already a member of this group');
    }

    // Добавляем пользователя в группу
    await db.insert(groupMembers).values({
      groupId: validatedData.groupId,
      userId: session.user.id,
      role: 'member',
    });

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error joining group:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to join group');
  }
}