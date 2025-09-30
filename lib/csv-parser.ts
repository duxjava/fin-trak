import { z } from 'zod';
import { NewTransaction, NewAccount, NewTransfer } from './schema';
import { db } from './db';
import { currencies } from './schema';
import { eq } from 'drizzle-orm';

// Схема для валидации CSV строки
export const csvTransactionSchema = z.object({
  date: z.string(),
  categoryName: z.string().optional(),
  payee: z.string().optional(),
  comment: z.string().optional(),
  outcomeAccountName: z.string().optional(),
  outcome: z.string().optional(),
  outcomeCurrencyShortTitle: z.string().optional(),
  incomeAccountName: z.string().optional(),
  income: z.string().optional(),
  incomeCurrencyShortTitle: z.string().optional(),
  createdDate: z.string(),
  changedDate: z.string(),
});

export type CsvTransaction = z.infer<typeof csvTransactionSchema>;

// Результат парсинга CSV
export interface CsvParseResult {
  transactions: ParsedTransaction[];
  transfers: ParsedTransfer[];
  accounts: ParsedAccount[];
  errors: ParseError[];
}

// Обработанная транзакция
export interface ParsedTransaction {
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'income';
  date: Date;
  accountName: string;
  currency: string;
  originalData: CsvTransaction;
}

// Обработанный перевод
export interface ParsedTransfer {
  fromAmount: number;
  toAmount: number;
  description: string;
  date: Date;
  fromAccountName: string;
  toAccountName: string;
  fromCurrency: string;
  toCurrency: string;
  originalData: CsvTransaction;
}

// Обработанный счет
export interface ParsedAccount {
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  currency: string;
}

// Ошибка парсинга
export interface ParseError {
  row: number;
  message: string;
  data?: any;
}

// Функция для парсинга CSV файла
export function parseCsvTransactions(csvContent: string): CsvParseResult {
  // Убираем BOM если он есть
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.trim().split('\n');
  
  if (lines.length === 0) {
    return { transactions: [], transfers: [], accounts: [], errors: [{ row: 0, message: 'CSV файл пуст' }] };
  }
  
  // Парсим заголовки с учетом кавычек
  const headers = parseCsvFields(lines[0]);
  
  const transactions: ParsedTransaction[] = [];
  const transfers: ParsedTransfer[] = [];
  const accounts: ParsedAccount[] = [];
  const errors: ParseError[] = [];
  const accountSet = new Set<string>();
  const accountCurrencies = new Map<string, Map<string, number>>(); // accountName -> currency -> count

  // Пропускаем заголовок и обрабатываем каждую строку
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Пропускаем пустые строки

    try {
      const rowData = parseCsvRow(line, headers);
      const csvTransaction = csvTransactionSchema.parse(rowData);
      
      const parsedTransaction = parseTransaction(csvTransaction);
      const parsedTransfer = parseTransfer(csvTransaction);
      
      if (parsedTransaction) {
        transactions.push(parsedTransaction);
        
        // Собираем информацию о валютах для каждого счета
        if (parsedTransaction.accountName) {
          if (!accountCurrencies.has(parsedTransaction.accountName)) {
            accountCurrencies.set(parsedTransaction.accountName, new Map());
          }
          const currencyMap = accountCurrencies.get(parsedTransaction.accountName)!;
          const currentCount = currencyMap.get(parsedTransaction.currency) || 0;
          currencyMap.set(parsedTransaction.currency, currentCount + 1);
        }
      }
      
      if (parsedTransfer) {
        transfers.push(parsedTransfer);
        
        // Собираем информацию о валютах для счетов перевода
        if (parsedTransfer.fromAccountName) {
          if (!accountCurrencies.has(parsedTransfer.fromAccountName)) {
            accountCurrencies.set(parsedTransfer.fromAccountName, new Map());
          }
          const currencyMap = accountCurrencies.get(parsedTransfer.fromAccountName)!;
          const currentCount = currencyMap.get(parsedTransfer.fromCurrency) || 0;
          currencyMap.set(parsedTransfer.fromCurrency, currentCount + 1);
        }
        
        if (parsedTransfer.toAccountName) {
          if (!accountCurrencies.has(parsedTransfer.toAccountName)) {
            accountCurrencies.set(parsedTransfer.toAccountName, new Map());
          }
          const currencyMap = accountCurrencies.get(parsedTransfer.toAccountName)!;
          const currentCount = currencyMap.get(parsedTransfer.toCurrency) || 0;
          currencyMap.set(parsedTransfer.toCurrency, currentCount + 1);
        }
      }
    } catch (error) {
      errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
        data: line
      });
    }
  }

  // Создаем счета на основе собранной информации о валютах
  for (const [accountName, currencyMap] of accountCurrencies) {
    // Находим валюту с наибольшим количеством транзакций
    let mainCurrency = 'RUB'; // По умолчанию
    let maxCount = 0;
    
    for (const [currency, count] of currencyMap) {
      if (count > maxCount) {
        maxCount = count;
        mainCurrency = currency;
      }
    }
    
    accounts.push(createAccountFromName(accountName, mainCurrency));
  }

  return { transactions, transfers, accounts, errors };
}

// Парсинг одной строки CSV
function parseCsvRow(line: string, headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const fields = parseCsvFields(line);
  
  headers.forEach((header, index) => {
    result[header] = fields[index] || '';
  });
  
  return result;
}

// Парсинг полей CSV с учетом кавычек
function parseCsvFields(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// Парсинг транзакции из CSV данных
function parseTransaction(csvData: CsvTransaction): ParsedTransaction | null {
  // Проверяем наличие сумм и счетов
  const hasOutcome = csvData.outcome && csvData.outcome.trim() && csvData.outcomeAccountName && csvData.outcomeAccountName.trim();
  const hasIncome = csvData.income && csvData.income.trim() && csvData.incomeAccountName && csvData.incomeAccountName.trim();
  
  // Если есть и расход, и доход, это перевод - не обрабатываем здесь
  if (hasOutcome && hasIncome) {
    return null;
  }
  
  // Если нет ни расхода, ни дохода, пропускаем транзакцию
  if (!hasOutcome && !hasIncome) {
    return null;
  }
  
  // Определяем тип транзакции
  let type: 'expense' | 'income';
  let amount: number;
  let accountName: string;
  let currency: string;
  
  if (hasOutcome) {
    // Расход
    type = 'expense';
    amount = parseAmount(csvData.outcome!);
    accountName = csvData.outcomeAccountName!.trim();
    currency = csvData.outcomeCurrencyShortTitle || 'RUB';
  } else if (hasIncome) {
    // Доход
    type = 'income';
    amount = parseAmount(csvData.income!);
    accountName = csvData.incomeAccountName!.trim();
    currency = csvData.incomeCurrencyShortTitle || 'RUB';
  } else {
    // Пропускаем записи без суммы
    return null;
  }
  
  // Создаем описание
  const description = createDescription(csvData);
  
  // Определяем категорию
  const category = csvData.categoryName || 'Без категории';
  
  // Парсим дату - используем createdDate если есть, иначе date
  const dateString = csvData.createdDate || csvData.date;
  const date = new Date(dateString);
  
  return {
    amount,
    description,
    category,
    type,
    date,
    accountName,
    currency,
    originalData: csvData
  };
}

// Парсинг перевода из CSV данных
function parseTransfer(csvData: CsvTransaction): ParsedTransfer | null {
  // Проверяем наличие сумм и счетов для перевода
  const hasOutcome = csvData.outcome && csvData.outcome.trim() && csvData.outcomeAccountName && csvData.outcomeAccountName.trim();
  const hasIncome = csvData.income && csvData.income.trim() && csvData.incomeAccountName && csvData.incomeAccountName.trim();
  
  // Перевод должен иметь и расход, и доход
  if (!hasOutcome || !hasIncome) {
    return null;
  }
  
  const fromAmount = parseAmount(csvData.outcome!);
  const toAmount = parseAmount(csvData.income!);
  const fromAccountName = csvData.outcomeAccountName!.trim();
  const toAccountName = csvData.incomeAccountName!.trim();
  const fromCurrency = csvData.outcomeCurrencyShortTitle || 'RUB';
  const toCurrency = csvData.incomeCurrencyShortTitle || 'RUB';
  
  // Создаем описание
  const description = createDescription(csvData);
  
  // Парсим дату - используем createdDate если есть, иначе date
  const dateString = csvData.createdDate || csvData.date;
  const date = new Date(dateString);
  
  return {
    fromAmount,
    toAmount,
    description,
    date,
    fromAccountName,
    toAccountName,
    fromCurrency,
    toCurrency,
    originalData: csvData
  };
}

// Парсинг суммы из строки
function parseAmount(amountStr: string): number {
  // Убираем пробелы и заменяем запятую на точку
  const cleaned = amountStr.replace(/\s/g, '').replace(',', '.');
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) {
    throw new Error(`Неверный формат суммы: ${amountStr}`);
  }
  
  // В данном CSV файле суммы уже указаны в правильном формате (рубли.копейки)
  // Например: "398,00" -> 398.00 рублей
  // НЕ делим на 100, так как суммы уже в правильном формате
  return amount;
}

// Создание описания транзакции
function createDescription(csvData: CsvTransaction): string {
  const parts: string[] = [];
  
  if (csvData.payee && csvData.payee.trim()) {
    parts.push(csvData.payee.trim());
  }
  
  if (csvData.comment && csvData.comment.trim()) {
    parts.push(csvData.comment.trim());
  }
  
  if (parts.length === 0) {
    return csvData.categoryName || 'Транзакция';
  }
  
  return parts.join(' - ');
}

// Создание счета из названия
function createAccountFromName(name: string, currency: string): ParsedAccount {
  const lowerName = name.toLowerCase();
  
  let type: 'cash' | 'bank' | 'credit' | 'investment' | 'other' = 'other';
  
  if (lowerName.includes('накопительный') || lowerName.includes('вклад')) {
    type = 'bank';
  } else if (lowerName.includes('инвестиции') || lowerName.includes('инвестиционный')) {
    type = 'investment';
  } else if (lowerName.includes('кредит') || lowerName.includes('займ')) {
    type = 'credit';
  } else if (lowerName.includes('кошелек') || lowerName.includes('наличные')) {
    type = 'cash';
  } else if (lowerName.includes('tinkoff') || lowerName.includes('сбербанк') || lowerName.includes('банк')) {
    type = 'bank';
  }
  
  return {
    name,
    type,
    currency
  };
}

// Преобразование транзакции в формат базы данных
export function convertToDbFormat(
  parsedTransaction: ParsedTransaction,
  accountIdMap: Map<string, number>
): NewTransaction {
  const accountId = accountIdMap.get(parsedTransaction.accountName);
  if (!accountId) {
    throw new Error(`Счет не найден: ${parsedTransaction.accountName}`);
  }
  
  return {
    amount: parsedTransaction.amount.toFixed(2), // Форматируем до 2 знаков после запятой
    description: parsedTransaction.description,
    category: parsedTransaction.category,
    type: parsedTransaction.type,
    date: parsedTransaction.date,
    accountId,
    // userId и groupId будут добавлены при импорте
    userId: '', // Будет заполнено при импорте
    groupId: '', // Будет заполнено при импорте
  };
}

// Преобразование перевода в формат базы данных
export function convertTransferToDbFormat(
  parsedTransfer: ParsedTransfer,
  accountIdMap: Map<string, number>
): NewTransfer {
  const fromAccountId = accountIdMap.get(parsedTransfer.fromAccountName);
  if (!fromAccountId) {
    throw new Error(`Счет отправления не найден: ${parsedTransfer.fromAccountName}`);
  }
  
  const toAccountId = accountIdMap.get(parsedTransfer.toAccountName);
  if (!toAccountId) {
    throw new Error(`Счет назначения не найден: ${parsedTransfer.toAccountName}`);
  }
  
  return {
    fromAmount: parsedTransfer.fromAmount.toFixed(2), // Форматируем до 2 знаков после запятой
    toAmount: parsedTransfer.toAmount.toFixed(2), // Форматируем до 2 знаков после запятой
    description: parsedTransfer.description,
    date: parsedTransfer.date,
    fromAccountId,
    toAccountId,
    // userId и groupId будут добавлены при импорте
    userId: '', // Будет заполнено при импорте
    groupId: '', // Будет заполнено при импорте
  };
}

export async function convertAccountToDbFormat(parsedAccount: ParsedAccount): Promise<NewAccount> {
  // Получаем ID валюты по коду
  const currencyId = await getCurrencyIdByCode(parsedAccount.currency);
  
  return {
    name: parsedAccount.name,
    type: parsedAccount.type,
    balance: '0.00',
    currencyId: currencyId,
    // userId и groupId будут добавлены при импорте
    userId: '', // Будет заполнено при импорте
    groupId: '', // Будет заполнено при импорте
  };
}

// Функция для получения ID валюты по коду
async function getCurrencyIdByCode(currencyCode: string): Promise<number> {
  try {
    const currency = await db.query.currencies.findFirst({
      where: eq(currencies.code, currencyCode.toUpperCase()),
    });
    
    if (currency) {
      return currency.id;
    }
    
    // Если валюта не найдена, создаем её
    const newCurrency = await createCurrencyIfNotExists(currencyCode);
    return newCurrency.id;
    
  } catch (error) {
    console.error('Ошибка при получении ID валюты:', error);
    // В крайнем случае возвращаем ID для RUB
    const rubCurrency = await db.query.currencies.findFirst({
      where: eq(currencies.code, 'RUB'),
    });
    return rubCurrency?.id || 1;
  }
}

// Функция для создания валюты, если её нет
async function createCurrencyIfNotExists(currencyCode: string): Promise<{ id: number; code: string; name: string; symbol: string }> {
  const code = currencyCode.toUpperCase();
  
  // Определяем символ и название валюты
  const currencyInfo = getCurrencyInfo(code);
  
  try {
    const insertedCurrency = await db.insert(currencies).values({
      code: code,
      name: currencyInfo.name,
      symbol: currencyInfo.symbol,
      isActive: 'true',
    }).returning();
    
    return insertedCurrency[0];
  } catch (error) {
    console.error(`Ошибка создания валюты ${code}:`, error);
    throw error;
  }
}

// Функция для получения информации о валюте
function getCurrencyInfo(code: string): { name: string; symbol: string } {
  const currencyMap: Record<string, { name: string; symbol: string }> = {
    'RUB': { name: 'Russian Ruble', symbol: '₽' },
    'USD': { name: 'US Dollar', symbol: '$' },
    'EUR': { name: 'Euro', symbol: '€' },
    'GBP': { name: 'British Pound', symbol: '£' },
    'JPY': { name: 'Japanese Yen', symbol: '¥' },
    'CNY': { name: 'Chinese Yuan', symbol: '¥' },
    'KRW': { name: 'South Korean Won', symbol: '₩' },
    'THB': { name: 'Thai Baht', symbol: '฿' },
    'GEL': { name: 'Georgian Lari', symbol: '₾' },
    'RSD': { name: 'Serbian Dinar', symbol: 'дин' },
    'MYR': { name: 'Malaysian Ringgit', symbol: 'RM' },
    'AED': { name: 'UAE Dirham', symbol: 'د.إ' },
    'TRY': { name: 'Turkish Lira', symbol: '₺' },
    'PLN': { name: 'Polish Zloty', symbol: 'zł' },
    'CZK': { name: 'Czech Koruna', symbol: 'Kč' },
    'HUF': { name: 'Hungarian Forint', symbol: 'Ft' },
    'RON': { name: 'Romanian Leu', symbol: 'lei' },
    'BGN': { name: 'Bulgarian Lev', symbol: 'лв' },
    'HRK': { name: 'Croatian Kuna', symbol: 'kn' },
    'UAH': { name: 'Ukrainian Hryvnia', symbol: '₴' },
    'BYN': { name: 'Belarusian Ruble', symbol: 'Br' },
    'KZT': { name: 'Kazakhstani Tenge', symbol: '₸' },
    'UZS': { name: 'Uzbekistani Som', symbol: 'сўм' },
    'KGS': { name: 'Kyrgyzstani Som', symbol: 'сом' },
    'TJS': { name: 'Tajikistani Somoni', symbol: 'SM' },
    'AMD': { name: 'Armenian Dram', symbol: '֏' },
    'AZN': { name: 'Azerbaijani Manat', symbol: '₼' },
    'GMD': { name: 'Gambian Dalasi', symbol: 'D' },
    'NGN': { name: 'Nigerian Naira', symbol: '₦' },
    'ZAR': { name: 'South African Rand', symbol: 'R' },
    'EGP': { name: 'Egyptian Pound', symbol: '£' },
    'MAD': { name: 'Moroccan Dirham', symbol: 'د.م.' },
    'TND': { name: 'Tunisian Dinar', symbol: 'د.ت' },
    'DZD': { name: 'Algerian Dinar', symbol: 'د.ج' },
    'LYD': { name: 'Libyan Dinar', symbol: 'ل.د' },
    'SDG': { name: 'Sudanese Pound', symbol: 'ج.س.' },
    'ETB': { name: 'Ethiopian Birr', symbol: 'Br' },
    'KES': { name: 'Kenyan Shilling', symbol: 'KSh' },
    'UGX': { name: 'Ugandan Shilling', symbol: 'USh' },
    'TZS': { name: 'Tanzanian Shilling', symbol: 'TSh' },
    'RWF': { name: 'Rwandan Franc', symbol: 'RF' },
    'BIF': { name: 'Burundian Franc', symbol: 'FBu' },
    'DJF': { name: 'Djiboutian Franc', symbol: 'Fdj' },
    'SOS': { name: 'Somali Shilling', symbol: 'S' },
    'ERN': { name: 'Eritrean Nakfa', symbol: 'Nfk' },
    'SSP': { name: 'South Sudanese Pound', symbol: '£' },
    'MUR': { name: 'Mauritian Rupee', symbol: '₨' },
    'SCR': { name: 'Seychellois Rupee', symbol: '₨' },
    'KMF': { name: 'Comorian Franc', symbol: 'CF' },
    'MGA': { name: 'Malagasy Ariary', symbol: 'Ar' },
    'MWK': { name: 'Malawian Kwacha', symbol: 'MK' },
    'ZMW': { name: 'Zambian Kwacha', symbol: 'ZK' },
    'BWP': { name: 'Botswana Pula', symbol: 'P' },
    'SZL': { name: 'Swazi Lilangeni', symbol: 'L' },
    'LSL': { name: 'Lesotho Loti', symbol: 'L' },
    'NAD': { name: 'Namibian Dollar', symbol: 'N$' },
    'AOA': { name: 'Angolan Kwanza', symbol: 'Kz' },
    'MZN': { name: 'Mozambican Metical', symbol: 'MT' },
    'ZWL': { name: 'Zimbabwean Dollar', symbol: 'Z$' },
    'SLE': { name: 'Sierra Leonean Leone', symbol: 'Le' },
    'SLL': { name: 'Sierra Leonean Leone (old)', symbol: 'Le' },
    'LRD': { name: 'Liberian Dollar', symbol: 'L$' },
    'GHS': { name: 'Ghanaian Cedi', symbol: '₵' },
    'XOF': { name: 'West African CFA Franc', symbol: 'CFA' },
    'XAF': { name: 'Central African CFA Franc', symbol: 'FCFA' },
    'CDF': { name: 'Congolese Franc', symbol: 'FC' },
    'CVE': { name: 'Cape Verdean Escudo', symbol: '$' },
    'STN': { name: 'São Tomé and Príncipe Dobra', symbol: 'Db' },
    'GNF': { name: 'Guinean Franc', symbol: 'FG' },
    'MRO': { name: 'Mauritanian Ouguiya', symbol: 'UM' },
    'MRU': { name: 'Mauritanian Ouguiya (new)', symbol: 'UM' },
    'XPF': { name: 'CFP Franc', symbol: '₣' },
    'TOP': { name: 'Tongan Paʻanga', symbol: 'T$' },
    'WST': { name: 'Samoan Tala', symbol: 'WS$' },
    'FJD': { name: 'Fijian Dollar', symbol: 'FJ$' },
    'VUV': { name: 'Vanuatu Vatu', symbol: 'Vt' },
    'SBD': { name: 'Solomon Islands Dollar', symbol: 'SI$' },
    'PGK': { name: 'Papua New Guinean Kina', symbol: 'K' },
    'AUD': { name: 'Australian Dollar', symbol: 'A$' },
    'NZD': { name: 'New Zealand Dollar', symbol: 'NZ$' },
    'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
    'MXN': { name: 'Mexican Peso', symbol: '$' },
    'GTQ': { name: 'Guatemalan Quetzal', symbol: 'Q' },
    'HNL': { name: 'Honduran Lempira', symbol: 'L' },
    'NIO': { name: 'Nicaraguan Córdoba', symbol: 'C$' },
    'CRC': { name: 'Costa Rican Colón', symbol: '₡' },
    'PAB': { name: 'Panamanian Balboa', symbol: 'B/.' },
    'DOP': { name: 'Dominican Peso', symbol: 'RD$' },
    'HTG': { name: 'Haitian Gourde', symbol: 'G' },
    'JMD': { name: 'Jamaican Dollar', symbol: 'J$' },
    'TTD': { name: 'Trinidad and Tobago Dollar', symbol: 'TT$' },
    'BBD': { name: 'Barbadian Dollar', symbol: 'Bds$' },
    'XCD': { name: 'East Caribbean Dollar', symbol: 'EC$' },
    'AWG': { name: 'Aruban Florin', symbol: 'ƒ' },
    'ANG': { name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
    'SRD': { name: 'Surinamese Dollar', symbol: '$' },
    'GYD': { name: 'Guyanese Dollar', symbol: 'G$' },
    'VES': { name: 'Venezuelan Bolívar', symbol: 'Bs' },
    'COP': { name: 'Colombian Peso', symbol: '$' },
    'BOB': { name: 'Bolivian Boliviano', symbol: 'Bs' },
    'PEN': { name: 'Peruvian Sol', symbol: 'S/' },
    'CLP': { name: 'Chilean Peso', symbol: '$' },
    'ARS': { name: 'Argentine Peso', symbol: '$' },
    'UYU': { name: 'Uruguayan Peso', symbol: '$U' },
    'PYG': { name: 'Paraguayan Guarani', symbol: '₲' },
    'BRL': { name: 'Brazilian Real', symbol: 'R$' },
    'FKP': { name: 'Falkland Islands Pound', symbol: '£' },
    'SHP': { name: 'Saint Helena Pound', symbol: '£' },
    'IMP': { name: 'Isle of Man Pound', symbol: '£' },
    'GGP': { name: 'Guernsey Pound', symbol: '£' },
    'JEP': { name: 'Jersey Pound', symbol: '£' },
    'GIP': { name: 'Gibraltar Pound', symbol: '£' },
    'CHF': { name: 'Swiss Franc', symbol: 'CHF' },
    'SEK': { name: 'Swedish Krona', symbol: 'kr' },
    'NOK': { name: 'Norwegian Krone', symbol: 'kr' },
    'DKK': { name: 'Danish Krone', symbol: 'kr' },
    'ISK': { name: 'Icelandic Krona', symbol: 'kr' },
    'FOK': { name: 'Faroese Krona', symbol: 'kr' },
    'ALL': { name: 'Albanian Lek', symbol: 'L' },
    'MKD': { name: 'Macedonian Denar', symbol: 'ден' },
    'BAM': { name: 'Bosnia and Herzegovina Convertible Mark', symbol: 'КМ' },
    'MNT': { name: 'Mongolian Tugrik', symbol: '₮' },
    'KHR': { name: 'Cambodian Riel', symbol: '៛' },
    'LAK': { name: 'Lao Kip', symbol: '₭' },
    'VND': { name: 'Vietnamese Dong', symbol: '₫' },
    'MMK': { name: 'Myanmar Kyat', symbol: 'K' },
    'BDT': { name: 'Bangladeshi Taka', symbol: '৳' },
    'LKR': { name: 'Sri Lankan Rupee', symbol: '₨' },
    'MVR': { name: 'Maldivian Rufiyaa', symbol: 'Rf' },
    'PKR': { name: 'Pakistani Rupee', symbol: '₨' },
    'AFN': { name: 'Afghan Afghani', symbol: '؋' },
    'IRR': { name: 'Iranian Rial', symbol: '﷼' },
    'IQD': { name: 'Iraqi Dinar', symbol: 'د.ع' },
    'JOD': { name: 'Jordanian Dinar', symbol: 'د.ا' },
    'LBP': { name: 'Lebanese Pound', symbol: 'ل.ل' },
    'SYP': { name: 'Syrian Pound', symbol: '£' },
    'ILS': { name: 'Israeli New Shekel', symbol: '₪' },
    'SAR': { name: 'Saudi Riyal', symbol: '﷼' },
    'QAR': { name: 'Qatari Riyal', symbol: '﷼' },
    'BHD': { name: 'Bahraini Dinar', symbol: 'د.ب' },
    'KWD': { name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    'OMR': { name: 'Omani Rial', symbol: '﷼' },
    'YER': { name: 'Yemeni Rial', symbol: '﷼' },
    'INR': { name: 'Indian Rupee', symbol: '₹' },
    'NPR': { name: 'Nepalese Rupee', symbol: '₨' },
    'BTN': { name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
    'MOP': { name: 'Macanese Pataca', symbol: 'MOP$' },
    'HKD': { name: 'Hong Kong Dollar', symbol: 'HK$' },
    'TWD': { name: 'Taiwan New Dollar', symbol: 'NT$' },
    'PHP': { name: 'Philippine Peso', symbol: '₱' },
    'IDR': { name: 'Indonesian Rupiah', symbol: 'Rp' },
    'SGD': { name: 'Singapore Dollar', symbol: 'S$' },
    'BND': { name: 'Brunei Dollar', symbol: 'B$' },
    'KID': { name: 'Kiribati Dollar', symbol: '$' },
    'TVD': { name: 'Tuvaluan Dollar', symbol: '$' },
    // Криптовалюты
    'BTC': { name: 'Bitcoin', symbol: '₿' },
    'ETH': { name: 'Ethereum', symbol: 'Ξ' },
    'USDT': { name: 'Tether USD', symbol: '₮' },
    'USDC': { name: 'USD Coin', symbol: '$' },
    'BNB': { name: 'Binance Coin', symbol: 'BNB' },
    'ADA': { name: 'Cardano', symbol: '₳' },
    'SOL': { name: 'Solana', symbol: '◎' },
    'XRP': { name: 'Ripple', symbol: 'XRP' },
    'DOT': { name: 'Polkadot', symbol: '●' },
    'DOGE': { name: 'Dogecoin', symbol: 'Ð' },
    'AVAX': { name: 'Avalanche', symbol: 'AVAX' },
    'MATIC': { name: 'Polygon', symbol: 'MATIC' },
    'LINK': { name: 'Chainlink', symbol: 'LINK' },
    'UNI': { name: 'Uniswap', symbol: 'UNI' },
    'LTC': { name: 'Litecoin', symbol: 'Ł' },
    'BCH': { name: 'Bitcoin Cash', symbol: 'BCH' },
    'ATOM': { name: 'Cosmos', symbol: 'ATOM' },
    'FTM': { name: 'Fantom', symbol: 'FTM' },
    'NEAR': { name: 'NEAR Protocol', symbol: 'NEAR' },
    'ALGO': { name: 'Algorand', symbol: 'ALGO' },
    'VET': { name: 'VeChain', symbol: 'VET' },
    'ICP': { name: 'Internet Computer', symbol: 'ICP' },
    'FIL': { name: 'Filecoin', symbol: 'FIL' },
    'TRX': { name: 'TRON', symbol: 'TRX' },
    'ETC': { name: 'Ethereum Classic', symbol: 'ETC' },
    'XLM': { name: 'Stellar', symbol: 'XLM' },
    'HBAR': { name: 'Hedera', symbol: 'HBAR' },
    'MANA': { name: 'Decentraland', symbol: 'MANA' },
    'SAND': { name: 'The Sandbox', symbol: 'SAND' },
    'AXS': { name: 'Axie Infinity', symbol: 'AXS' },
    'CHZ': { name: 'Chiliz', symbol: 'CHZ' },
    'ENJ': { name: 'Enjin Coin', symbol: 'ENJ' },
    'BAT': { name: 'Basic Attention Token', symbol: 'BAT' },
    'ZEC': { name: 'Zcash', symbol: 'ZEC' },
    'DASH': { name: 'Dash', symbol: 'DASH' },
    'XMR': { name: 'Monero', symbol: 'XMR' },
    'NEO': { name: 'NEO', symbol: 'NEO' },
    'QTUM': { name: 'Qtum', symbol: 'QTUM' },
    'IOTA': { name: 'IOTA', symbol: 'MIOTA' },
    'EOS': { name: 'EOS', symbol: 'EOS' },
    'XTZ': { name: 'Tezos', symbol: 'XTZ' },
    'AAVE': { name: 'Aave', symbol: 'AAVE' },
    'COMP': { name: 'Compound', symbol: 'COMP' },
    'MKR': { name: 'Maker', symbol: 'MKR' },
    'SNX': { name: 'Synthetix', symbol: 'SNX' },
    'YFI': { name: 'Yearn.finance', symbol: 'YFI' },
    'SUSHI': { name: 'SushiSwap', symbol: 'SUSHI' },
    'CRV': { name: 'Curve DAO Token', symbol: 'CRV' },
    '1INCH': { name: '1inch', symbol: '1INCH' },
    'GRT': { name: 'The Graph', symbol: 'GRT' },
    'OCEAN': { name: 'Ocean Protocol', symbol: 'OCEAN' },
    'REN': { name: 'Ren', symbol: 'REN' },
    'KNC': { name: 'Kyber Network', symbol: 'KNC' },
    'BAND': { name: 'Band Protocol', symbol: 'BAND' },
    'UMA': { name: 'UMA', symbol: 'UMA' },
    'ZRX': { name: '0x Protocol', symbol: 'ZRX' },
    'REP': { name: 'Augur', symbol: 'REP' },
    'STORJ': { name: 'Storj', symbol: 'STORJ' },
    'DNT': { name: 'district0x', symbol: 'DNT' },
    'FUN': { name: 'FunFair', symbol: 'FUN' },
    'CVC': { name: 'Civic', symbol: 'CVC' },
    'GNT': { name: 'Golem', symbol: 'GNT' },
    'OMG': { name: 'OMG Network', symbol: 'OMG' },
    'KEEP': { name: 'Keep Network', symbol: 'KEEP' },
    'NU': { name: 'NuCypher', symbol: 'NU' },
    'LRC': { name: 'Loopring', symbol: 'LRC' },
    'ANT': { name: 'Aragon', symbol: 'ANT' },
    'MLN': { name: 'Melon', symbol: 'MLN' },
    'MCO': { name: 'Crypto.com Coin', symbol: 'MCO' },
    'CRO': { name: 'Crypto.com Coin', symbol: 'CRO' },
    'SHIB': { name: 'Shiba Inu', symbol: 'SHIB' },
    'PEPE': { name: 'Pepe', symbol: 'PEPE' },
    'FLOKI': { name: 'Floki', symbol: 'FLOKI' },
    'BONK': { name: 'Bonk', symbol: 'BONK' },
    'WIF': { name: 'dogwifhat', symbol: 'WIF' },
    'BOME': { name: 'BOOK OF MEME', symbol: 'BOME' },
    'MYRO': { name: 'Myro', symbol: 'MYRO' },
    'POPCAT': { name: 'Popcat', symbol: 'POPCAT' },
    'MEW': { name: 'Cat in a Dogs World', symbol: 'MEW' },
    'GOAT': { name: 'Goatseus Maximus', symbol: 'GOAT' },
    'PNUT': { name: 'Peanut the Squirrel', symbol: 'PNUT' },
  };
  
  return currencyMap[code] || { 
    name: `${code} Currency`, 
    symbol: code 
  };
}

