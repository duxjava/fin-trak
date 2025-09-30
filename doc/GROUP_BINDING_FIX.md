# Исправление привязки к группам

## Проблема

Счета и транзакции всегда создавались в дефолтной группе пользователя, независимо от того, какая группа была выбрана в интерфейсе.

## Решение

Обновлена логика создания счетов и транзакций, чтобы они привязывались к выбранной в интерфейсе группе.

## Изменения

### 1. **Функция `createAccount`** (`actions/account-actions.ts`)

**Было:**
```typescript
// Всегда использовалась дефолтная группа
const defaultGroup = await db.query.groups.findFirst({
  where: and(
    eq(groups.createdBy, session.user.id),
    eq(groups.isDefault, 'true')
  ),
});
```

**Стало:**
```typescript
const groupId = formData.get('groupId') as string;
let targetGroupId = groupId;

// Если groupId не передан, используем дефолтную группу
if (!targetGroupId) {
  // ... поиск дефолтной группы
} else {
  // Проверяем, что пользователь является участником указанной группы
  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, targetGroupId),
      eq(groupMembers.userId, session.user.id)
    ),
  });
}
```

### 2. **Функция `addTransaction`** (`actions/transaction-actions.ts`)

Аналогичные изменения для транзакций - добавлена поддержка `groupId` из формы.

### 3. **Страницы создания** (`app/accounts/create/page.tsx`, `app/transactions/add/page.tsx`)

**Добавлено:**
```typescript
interface CreateAccountPageProps {
  searchParams: {
    group?: string;
  };
}

// Передача groupId в компонент
<CreateAccountForm groupId={searchParams.group} />
```

### 4. **Ссылки в дашборде** (`app/dashboard/page.tsx`)

**Обновлены ссылки:**
```typescript
// Было
href="/accounts/create"
href="/transactions/add"

// Стало
href={`/accounts/create?group=${currentGroupId}`}
href={`/transactions/add?group=${currentGroupId}`}
```

### 5. **Компоненты форм**

**`CreateAccountForm`** и **`AddTransactionForm`** уже поддерживали `groupId`:
```typescript
interface CreateAccountFormProps {
  groupId?: string;
}

// Скрытое поле в форме
{groupId && <input type="hidden" name="groupId" value={groupId} />}
```

## Безопасность

### ✅ **Проверка принадлежности к группе**
- Перед созданием счета/транзакции проверяется, что пользователь является участником указанной группы
- Если `groupId` не передан, используется дефолтная группа (обратная совместимость)

### ✅ **Валидация данных**
- Все существующие валидации сохранены
- Добавлена проверка членства в группе

## Результат

### 🎯 **Теперь работает правильно:**
1. **Счета создаются в выбранной группе** - не в дефолтной
2. **Транзакции создаются в выбранной группе** - не в дефолтной
3. **Обратная совместимость** - если `groupId` не передан, используется дефолтная группа
4. **Безопасность** - проверка принадлежности к группе

### 📊 **Статистика сборки:**
- ✅ **12 страниц** сгенерированы
- ✅ **Линтинг** без ошибок
- ✅ **Типизация** корректна
- ✅ **Размеры** не изменились

## Как тестировать

1. **Переключитесь на группу** через селектор групп
2. **Создайте счет** - он должен появиться в выбранной группе
3. **Создайте транзакцию** - она должна появиться в выбранной группе
4. **Переключитесь на другую группу** - счета и транзакции должны быть разными

Теперь система корректно привязывает счета и транзакции к выбранной группе!
