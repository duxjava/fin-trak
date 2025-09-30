'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createGroup, joinGroup, setDefaultGroup, renameGroup } from '@/actions/group-actions';

interface Group {
  id: string;
  name: string;
  isDefault: string;
}

interface GroupSelectorProps {
  groups: Group[];
  currentGroupId: string;
}

export default function GroupSelector({ groups, currentGroupId }: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const currentGroup = groups.find(g => g.id === currentGroupId);

  const handleGroupSelect = (groupId: string) => {
    // Определяем правильный параметр для текущей страницы
    const currentPath = window.location.pathname;
    const paramName = currentPath === '/dashboard' ? 'group' : 'groupId';
    
    // Обновляем URL с новым параметром группы
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(paramName, groupId);
    router.push(`${currentPath}?${searchParams.toString()}`);
    setIsOpen(false);
  };

  const handleCreateGroup = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await createGroup(formData);
      setSuccess('Группа создана успешно!');
      setShowCreateModal(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания группы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await joinGroup(formData);
      setSuccess('Вы успешно присоединились к группе!');
      setShowJoinModal(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка присоединения к группе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (groupId: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await setDefaultGroup(groupId);
      setSuccess('Группа установлена как дефолтная!');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка установки дефолтной группы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameGroup = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Сначала переименовываем группу
      await renameGroup(formData);
      
      // Если отмечен чекбокс "Сделать дефолтной", устанавливаем группу как дефолтную
      const setAsDefault = formData.get('setAsDefault');
      if (setAsDefault === 'on') {
        await setDefaultGroup(selectedGroupForEdit!.id);
      }
      
      setSuccess('Группа обновлена успешно!');
      setShowEditModal(false);
      setSelectedGroupForEdit(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления группы');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (group: Group) => {
    setSelectedGroupForEdit(group);
    setShowEditModal(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        {/* Кнопка выбора группы */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">👥</span>
            <span className="truncate">
              {currentGroup?.name || 'Выберите группу'}
            </span>
            {currentGroup?.isDefault === 'true' && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Дефолтная
              </span>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающий список */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100">
                  <button
                    onClick={() => handleGroupSelect(group.id)}
                    className={`flex-1 text-left text-sm ${
                      group.id === currentGroupId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="truncate">{group.name}</span>
                      {group.isDefault === 'true' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Дефолтная
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Участник
                    </div>
                  </button>
                  
                  {/* Кнопка редактирования группы */}
                  <div className="flex items-center ml-2">
                    <button
                      onClick={() => openEditModal(group)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Редактировать группу"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Кнопки управления группами */}
              <div className="border-t border-gray-200 pt-1">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                >
                  <span className="text-lg">➕</span>
                  <span>Создать группу</span>
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                >
                  <span className="text-lg">🔗</span>
                  <span>Присоединиться к группе</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модалка создания группы */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Создать группу</h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form action={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Название группы
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите название группы"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка присоединения к группе */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Присоединиться к группе</h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form action={handleJoinGroup} className="space-y-4">
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
                  ID группы
                </label>
                <input
                  type="text"
                  id="groupId"
                  name="groupId"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Введите ID группы"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Попросите администратора группы предоставить ID
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Присоединение...' : 'Присоединиться'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка редактирования группы */}
      {showEditModal && selectedGroupForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Редактировать группу</h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form action={handleRenameGroup} className="space-y-4">
              <input type="hidden" name="groupId" value={selectedGroupForEdit.id} />
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Название группы
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={selectedGroupForEdit.name}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите название группы"
                />
              </div>
              
              {/* Чекбокс для установки дефолтной группы */}
              {selectedGroupForEdit.isDefault !== 'true' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    name="setAsDefault"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="setAsDefault" className="ml-2 block text-sm text-gray-700">
                    Сделать дефолтной группой
                  </label>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroupForEdit(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
