import { db } from './db';
import { accounts, transactions, transfers } from './schema';
import { eq } from 'drizzle-orm';
import { 
  parseCsvTransactions, 
  convertToDbFormat, 
  convertTransferToDbFormat,
  convertAccountToDbFormat,
  CsvParseResult,
  ParsedTransaction,
  ParsedTransfer,
  ParsedAccount 
} from './csv-parser';

export interface ImportResult {
  success: boolean;
  importedTransactions: number;
  importedTransfers: number;
  importedAccounts: number;
  errors: string[];
  warnings: string[];
}

// Основная функция импорта
export async function importCsvData(
  csvContent: string,
  userId: string,
  groupId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedTransactions: 0,
    importedTransfers: 0,
    importedAccounts: 0,
    errors: [],
    warnings: []
  };

  try {
    // Парсим CSV данные
    const parseResult: CsvParseResult = parseCsvTransactions(csvContent);
    
    if (parseResult.errors.length > 0) {
      result.errors.push(`Ошибки парсинга: ${parseResult.errors.length} строк`);
      parseResult.errors.forEach(error => {
        result.errors.push(`Строка ${error.row}: ${error.message}`);
      });
    }

    // Создаем счета
    const accountIdMap = new Map<string, number>();
    for (const parsedAccount of parseResult.accounts) {
      try {
        // Проверяем, существует ли уже такой счет
        const existingAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.name, parsedAccount.name))
          .limit(1);

        if (existingAccount.length > 0) {
          accountIdMap.set(parsedAccount.name, existingAccount[0].id);
          result.warnings.push(`Счет "${parsedAccount.name}" уже существует`);
        } else {
          const newAccount = await convertAccountToDbFormat(parsedAccount);
          newAccount.userId = userId;
          newAccount.groupId = groupId;
          
          const insertedAccount = await db.insert(accounts).values(newAccount).returning();
          accountIdMap.set(parsedAccount.name, insertedAccount[0].id);
          result.importedAccounts++;
        }
      } catch (error) {
        result.errors.push(`Ошибка создания счета "${parsedAccount.name}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }

    // Создаем транзакции
    for (const parsedTransaction of parseResult.transactions) {
      try {
        const newTransaction = convertToDbFormat(parsedTransaction, accountIdMap);
        newTransaction.userId = userId;
        newTransaction.groupId = groupId;
        
        await db.insert(transactions).values(newTransaction);
        result.importedTransactions++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        result.errors.push(`Ошибка создания транзакции "${parsedTransaction.description}" (${parsedTransaction.type}, ${parsedTransaction.amount} ${parsedTransaction.currency}): ${errorMessage}`);
      }
    }

    // Создаем переводы
    for (const parsedTransfer of parseResult.transfers) {
      try {
        const newTransfer = convertTransferToDbFormat(parsedTransfer, accountIdMap);
        newTransfer.userId = userId;
        newTransfer.groupId = groupId;
        
        await db.insert(transfers).values(newTransfer);
        result.importedTransfers++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        result.errors.push(`Ошибка создания перевода "${parsedTransfer.description}" (${parsedTransfer.fromAmount} ${parsedTransfer.fromCurrency} -> ${parsedTransfer.toAmount} ${parsedTransfer.toCurrency}): ${errorMessage}`);
      }
    }

    result.success = result.errors.length === 0;
    
    if (result.warnings.length > 0) {
      result.warnings.unshift(`Импорт завершен с предупреждениями`);
    }

  } catch (error) {
    result.errors.push(`Критическая ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }

  return result;
}

// Функция для предварительного просмотра данных перед импортом
export function previewCsvData(csvContent: string): {
  summary: {
    totalRows: number;
    transactionsCount: number;
    transfersCount: number;
    accountsCount: number;
    errorsCount: number;
  };
  accounts: ParsedAccount[];
  sampleTransactions: ParsedTransaction[];
  sampleTransfers: ParsedTransfer[];
  errors: string[];
} {
  const parseResult = parseCsvTransactions(csvContent);
  
  return {
    summary: {
      totalRows: parseResult.transactions.length + parseResult.transfers.length + parseResult.errors.length,
      transactionsCount: parseResult.transactions.length,
      transfersCount: parseResult.transfers.length,
      accountsCount: parseResult.accounts.length,
      errorsCount: parseResult.errors.length,
    },
    accounts: parseResult.accounts,
    sampleTransactions: parseResult.transactions.slice(0, 10), // Первые 10 транзакций для предварительного просмотра
    sampleTransfers: parseResult.transfers.slice(0, 10), // Первые 10 переводов для предварительного просмотра
    errors: parseResult.errors.map(error => `Строка ${error.row}: ${error.message}`)
  };
}

// Функция для валидации CSV файла
export function validateCsvFile(csvContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      result.errors.push('Файл должен содержать заголовок и хотя бы одну строку данных');
      result.isValid = false;
      return result;
    }

    const headers = lines[0].split(',');
    const expectedHeaders = [
      'date', 'categoryName', 'payee', 'comment', 'outcomeAccountName', 
      'outcome', 'outcomeCurrencyShortTitle', 'incomeAccountName', 
      'income', 'incomeCurrencyShortTitle', 'createdDate', 'changedDate'
    ];

    // Проверяем заголовки
    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      result.errors.push(`Отсутствуют обязательные заголовки: ${missingHeaders.join(', ')}`);
      result.isValid = false;
    }

    // Парсим данные для дополнительной проверки
    const parseResult = parseCsvTransactions(csvContent);
    
    if (parseResult.errors.length > 0) {
      result.warnings.push(`Найдено ${parseResult.errors.length} строк с ошибками`);
    }

    if (parseResult.transactions.length === 0 && parseResult.transfers.length === 0) {
      result.errors.push('Не найдено ни одной корректной транзакции или перевода');
      result.isValid = false;
    }

    if (parseResult.accounts.length === 0) {
      result.errors.push('Не найдено ни одного счета');
      result.isValid = false;
    }

  } catch (error) {
    result.errors.push(`Ошибка валидации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    result.isValid = false;
  }

  return result;
}

