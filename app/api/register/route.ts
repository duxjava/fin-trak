import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/actions/auth-actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    await signUp(formData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 400 }
    );
  }
}
