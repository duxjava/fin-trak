'use server';

import { db } from '@/lib/db';
import { currencies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

interface ExchangeRate {
  currency: string;
  rate: number;
}

interface ExchangeRatesResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Кэш для курсов валют (в реальном приложении лучше использовать Redis)
const exchangeRatesCache = new Map<string, { rates: ExchangeRate[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 час

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const cacheKey = 'exchange_rates';
  const cached = exchangeRatesCache.get(cacheKey);
  
  // Проверяем кэш
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }

  try {
    // Получаем список активных валют из базы данных
    const activeCurrencies = await db.query.currencies.findMany({
      where: eq(currencies.isActive, 'true'),
    });

    // Формируем список валют для запроса (исключаем RUB как базовую)
    const currencyCodes = activeCurrencies
      .map(c => c.code)
      .filter(code => code !== 'RUB')
      .join(',');

    if (!currencyCodes) {
      return [{ currency: 'RUB', rate: 1 }];
    }

    // Запрашиваем курсы валют к USD, затем конвертируем к RUB
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD?symbols=${currencyCodes}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ExchangeRatesResponse = await response.json();

    // Получаем курс RUB к USD
    const rubToUsdResponse = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD?symbols=RUB',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    let rubToUsdRate = 95; // Дефолтный курс, если API недоступен
    if (rubToUsdResponse.ok) {
      const rubData = await rubToUsdResponse.json();
      rubToUsdRate = rubData.rates.RUB || 95;
    }

    // Преобразуем данные в нужный формат (конвертируем к RUB)
    // API возвращает курсы как "сколько единиц валюты за 1 USD"
    // Нам нужно получить "сколько рублей за 1 единицу валюты"
    const rates: ExchangeRate[] = [
      { currency: 'RUB', rate: 1 }, // RUB как базовая валюта
      ...Object.entries(data.rates)
        .filter(([currency]) => currency !== 'RUB') // Исключаем RUB из списка валют
        .map(([currency, usdRate]) => ({
          currency,
          // Правильная формула: RUB/currency = (RUB/USD) / (currency/USD)
          // rubToUsdRate - это сколько рублей за 1 USD
          // usdRate - это сколько единиц валюты за 1 USD
          // Поэтому: rubToUsdRate / usdRate = сколько рублей за 1 единицу валюты
          rate: rubToUsdRate / usdRate,
        })),
    ];

    // Сохраняем в кэш
    exchangeRatesCache.set(cacheKey, {
      rates,
      timestamp: Date.now(),
    });

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Возвращаем кэшированные данные или дефолтные курсы
    if (cached) {
      return cached.rates;
    }

    // Дефолтные курсы к RUB (примерные)
    return [
      { currency: 'RUB', rate: 1 },
      { currency: 'USD', rate: 95 },
      { currency: 'EUR', rate: 102 },
      { currency: 'GBP', rate: 118 },
      { currency: 'GEL', rate: 35 },
      { currency: 'THB', rate: 2.7 },
      { currency: 'KRW', rate: 0.073 },
      { currency: 'CNY', rate: 13.2 },
      { currency: 'MYR', rate: 20.2 },
      { currency: 'RSD', rate: 0.88 },
    ];
  }
}

export async function convertToRUB(amount: number, fromCurrency: string): Promise<number> {
  const rates = await getExchangeRates();
  const rate = rates.find(r => r.currency === fromCurrency);
  
  if (!rate) {
    console.warn(`Exchange rate not found for currency: ${fromCurrency}`);
    return amount; // Возвращаем исходную сумму, если курс не найден
  }

  // Курс хранится как "сколько рублей за единицу валюты"
  // Поэтому умножаем сумму на курс
  return amount * rate.rate;
}

