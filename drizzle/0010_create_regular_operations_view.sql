-- Создание обычного представления для объединения транзакций и переводов
CREATE VIEW operations_view AS
SELECT 
    'transaction' as operation_type,
    t.id::text as operation_id,
    t.amount,
    t.description,
    t.category,
    t.type,
    t.date,
    t.user_id,
    t.group_id,
    t.account_id as primary_account_id,
    t.account_id as secondary_account_id,
    NULL::decimal as secondary_amount,
    t.created_at,
    -- Добавляем поля для сортировки
    t.date as sort_date,
    t.created_at as sort_created_at
FROM transactions t

UNION ALL

SELECT 
    'transfer' as operation_type,
    tr.id::text as operation_id,
    tr.from_amount as amount,
    tr.description,
    NULL::text as category,
    'transfer' as type,
    tr.date,
    tr.user_id,
    tr.group_id,
    tr.from_account_id as primary_account_id,
    tr.to_account_id as secondary_account_id,
    tr.to_amount as secondary_amount,
    tr.created_at,
    -- Добавляем поля для сортировки
    tr.date as sort_date,
    tr.created_at as sort_created_at
FROM transfers tr;

-- Создаем индексы для быстрого поиска и сортировки
-- Для обычного представления индексы создаются на базовых таблицах
CREATE INDEX IF NOT EXISTS idx_transactions_group_date ON transactions (group_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_group_date ON transfers (group_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account_id ON transfers (from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account_id ON transfers (to_account_id);
