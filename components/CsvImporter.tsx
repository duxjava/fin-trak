'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Временно закомментируем иконки из-за проблем с lucide-react
// import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  importedTransactions: number;
  importedAccounts: number;
  errors: string[];
  warnings: string[];
}

interface PreviewData {
  summary: {
    totalRows: number;
    transactionsCount: number;
    accountsCount: number;
    errorsCount: number;
  };
  accounts: Array<{
    name: string;
    type: string;
    currency: string;
  }>;
  sampleTransactions: Array<{
    amount: number;
    description: string;
    category: string;
    type: string;
    date: string;
    accountName: string;
    currency: string;
  }>;
  errors: string[];
}

export default function CsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'preview');

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка предварительного просмотра');
      }

      setPreviewData(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта');
      }

      setImportResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📤</span>
            Импорт транзакций из CSV
          </CardTitle>
          <CardDescription>
            Загрузите CSV файл с транзакциями для импорта в систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="csv-file" className="block text-sm font-medium">
              Выберите CSV файл
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="flex gap-2">
              <Button onClick={handlePreview} disabled={isLoading}>
                <span className="mr-2">👁️</span>
                Предварительный просмотр
              </Button>
              <Button variant="outline" onClick={reset} disabled={isLoading}>
                Сбросить
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <span className="mr-2">❌</span>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewData && (
            <div className="space-y-4">
              <Alert>
                <span className="mr-2">✅</span>
                <AlertDescription>
                  Файл успешно обработан. Найдено {previewData.summary.transactionsCount} транзакций 
                  и {previewData.summary.accountsCount} счетов.
                  {previewData.summary.errorsCount > 0 && (
                    <span className="text-yellow-600">
                      {' '}Внимание: {previewData.summary.errorsCount} строк с ошибками.
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Счета</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previewData.accounts.map((account, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-gray-500 ml-2">
                            ({account.type}, {account.currency})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Примеры транзакций</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previewData.sampleTransactions.slice(0, 5).map((transaction, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-gray-500">
                            {transaction.amount} {transaction.currency} • {transaction.category} • {transaction.accountName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {previewData.errors.length > 0 && (
                <Alert variant="destructive">
                  <span className="mr-2">⚠️</span>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Ошибки в файле:</div>
                      {previewData.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                      {previewData.errors.length > 5 && (
                        <div className="text-sm">... и еще {previewData.errors.length - 5} ошибок</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleImport} disabled={isLoading} className="w-full">
                <span className="mr-2">📥</span>
                Импортировать данные
              </Button>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.success ? "default" : "destructive"}>
                {importResult.success ? (
                  <span className="mr-2">✅</span>
                ) : (
                  <span className="mr-2">❌</span>
                )}
                <AlertDescription>
                  {importResult.success ? (
                    <>
                      Импорт завершен успешно! Импортировано {importResult.importedTransactions} транзакций 
                      и {importResult.importedAccounts} счетов.
                    </>
                  ) : (
                    'Импорт завершен с ошибками.'
                  )}
                </AlertDescription>
              </Alert>

              {importResult.warnings.length > 0 && (
                <Alert>
                  <span className="mr-2">⚠️</span>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Предупреждения:</div>
                      {importResult.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <span className="mr-2">❌</span>
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Ошибки:</div>
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={reset} variant="outline" className="w-full">
                Импортировать другой файл
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
