import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">FinTrak</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Перейти в Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Управляйте семейными
              <span className="text-indigo-600"> финансами</span>
              <br />
              вместе
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              FinTrak помогает семьям отслеживать расходы, планировать бюджет и достигать финансовых целей сообща. 
              Простой, безопасный и эффективный способ управления деньгами.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Перейти в Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Начать бесплатно
                  </Link>
                  <Link
                    href="/sign-in"
                    className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    Уже есть аккаунт?
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Почему выбирают FinTrak?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Современные инструменты для управления семейными финансами
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Отслеживание расходов</h3>
                <p className="text-gray-600">
                  Легко записывайте и категоризируйте все семейные траты в одном месте
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Семейные группы</h3>
                <p className="text-gray-600">
                  Создавайте группы и приглашайте членов семьи для совместного управления финансами
                </p>
              </div>

              <div className="text-center p-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Аналитика и отчеты</h3>
                <p className="text-gray-600">
                  Получайте детальную статистику по расходам и планируйте бюджет эффективнее
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-indigo-600 rounded-2xl p-12 text-center text-white mb-20">
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать управлять финансами?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Присоединяйтесь к тысячам семей, которые уже используют FinTrak
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Перейти в Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Создать аккаунт
                  </Link>
                  <Link
                    href="/sign-in"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                  >
                    Войти в систему
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">FinTrak</h3>
            <p className="text-gray-400 mb-6">
              Семейный трекер финансов для современного мира
            </p>
            <div className="flex justify-center space-x-6">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/sign-up"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 FinTrak. Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
