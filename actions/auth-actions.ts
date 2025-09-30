'use server';

import { db } from '@/lib/db';
import { users, groups, groupMembers } from '@/lib/schema';
import { signUpSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function signUp(formData: FormData) {
  const validatedData = signUpSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Создаем пользователя и дефолтную группу в одной транзакции
    const userId = randomBytes(16).toString('hex');
    const groupId = randomBytes(4).toString('hex');
    
    await db.transaction(async (tx) => {
      // Создаем пользователя
      await tx.insert(users).values({
        id: userId,
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      });

      // Создаем дефолтную группу
      await tx.insert(groups).values({
        id: groupId,
        name: 'Бюджет',
        createdBy: userId,
        isDefault: 'true',
      });

      // Добавляем пользователя как администратора группы
      await tx.insert(groupMembers).values({
        groupId,
        userId,
        role: 'admin',
      });
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create account');
  }
}
