'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GroupSelector from '@/components/GroupSelector';
import { logoutAction } from '@/actions/logout-action';

interface NavigationProps {
  currentGroupId?: string;
  groups?: Array<{
    id: string;
    name: string;
    isDefault: string;
    role: string;
  }>;
}

export default function Navigation({ currentGroupId, groups = [] }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Дашборд',
      href: '/dashboard',
      icon: '📊',
    },
    {
      name: 'Статистика',
      href: '/statistics',
      icon: '📈',
    },
    {
      name: 'Импорт',
      href: '/import',
      icon: '📥',
    },
  ];


  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                FinTrak
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href + (currentGroupId ? `?groupId=${currentGroupId}` : '')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right side - Group Selector and Logout */}
          <div className="flex items-center space-x-4">
            {groups.length > 0 && (
              <div className="w-64">
                <GroupSelector 
                  groups={groups}
                  currentGroupId={currentGroupId}
                />
              </div>
            )}
            
            <form action={logoutAction}>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md whitespace-nowrap text-sm"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
