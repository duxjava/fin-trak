import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/actions/exchange-rates-actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const exchangeRates = await getExchangeRates();
    
    return NextResponse.json({
      success: true,
      rates: exchangeRates,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates' 
      }, 
      { status: 500 }
    );
  }
}
