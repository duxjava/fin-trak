-- Создание материализованного представления для объединения транзакций и переводов
CREATE MATERIALIZED VIEW operations_view AS
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
CREATE INDEX idx_operations_view_group_id ON operations_view (group_id);
CREATE INDEX idx_operations_view_sort_date ON operations_view (sort_date DESC, sort_created_at DESC);
CREATE INDEX idx_operations_view_user_id ON operations_view (user_id);
CREATE INDEX idx_operations_view_primary_account_id ON operations_view (primary_account_id);
CREATE INDEX idx_operations_view_secondary_account_id ON operations_view (secondary_account_id);

-- Создаем функцию для обновления материализованного представления
CREATE OR REPLACE FUNCTION refresh_operations_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW operations_view;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для автоматического обновления представления при изменении данных
CREATE OR REPLACE FUNCTION trigger_refresh_operations_view()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_operations_view();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для транзакций
CREATE TRIGGER refresh_operations_view_on_transaction_insert
    AFTER INSERT ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();

CREATE TRIGGER refresh_operations_view_on_transaction_update
    AFTER UPDATE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();

CREATE TRIGGER refresh_operations_view_on_transaction_delete
    AFTER DELETE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();

-- Триггеры для переводов
CREATE TRIGGER refresh_operations_view_on_transfer_insert
    AFTER INSERT ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();

CREATE TRIGGER refresh_operations_view_on_transfer_update
    AFTER UPDATE ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();

CREATE TRIGGER refresh_operations_view_on_transfer_delete
    AFTER DELETE ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations_view();
