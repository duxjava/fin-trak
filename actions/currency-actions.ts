'use server';

import { db } from '@/lib/db';
import { currencies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function getCurrencies() {
  try {
    const currenciesList = await db.query.currencies.findMany({
      where: eq(currencies.isActive, 'true'),
      orderBy: [currencies.code],
    });
    
    return currenciesList;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw new Error('Failed to fetch currencies');
  }
}

