import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, groups, groupMembers } from '@/lib/schema';
import { signUpSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    const userId = crypto.randomUUID();
    const groupId = randomBytes(4).toString('hex');

    // Create user and default group in single transaction
    await db.transaction(async (tx) => {
      // Create user
      await tx.insert(users).values({
        id: userId,
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      });

      // Create default group
      await tx.insert(groups).values({
        id: groupId,
        name: 'Бюджет',
        createdBy: userId,
        isDefault: 'true',
      });

      // Add user as group admin
      await tx.insert(groupMembers).values({
        groupId,
        userId,
        role: 'admin',
      });
    });

    return NextResponse.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
