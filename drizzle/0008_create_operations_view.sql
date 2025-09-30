-- Создание материализованного представления для объединения транзакций и переводов
-- Это позволит правильно сортировать и пагинировать операции

-- Создаем материализованное представление операций
CREATE MATERIALIZED VIEW operations AS
SELECT 
    'transaction' as operation_type,
    id::text as operation_id,
    amount,
    description,
    category,
    date,
    user_id,
    account_id as primary_account_id,
    account_id as secondary_account_id,
    NULL::numeric as secondary_amount,
    created_at
FROM transactions
UNION ALL
SELECT 
    'transfer' as operation_type,
    id::text as operation_id,
    from_amount as amount,
    description,
    NULL as category,
    date,
    user_id,
    from_account_id as primary_account_id,
    to_account_id as secondary_account_id,
    to_amount as secondary_amount,
    created_at
FROM transfers;

-- Создаем индексы для быстрого поиска и сортировки
CREATE INDEX idx_operations_date ON operations (date DESC);
CREATE INDEX idx_operations_user_id ON operations (user_id);
CREATE INDEX idx_operations_primary_account ON operations (primary_account_id);
CREATE INDEX idx_operations_secondary_account ON operations (secondary_account_id);
CREATE INDEX idx_operations_type ON operations (operation_type);

-- Создаем функцию для обновления материализованного представления
CREATE OR REPLACE FUNCTION refresh_operations()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW operations;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для автоматического обновления представления
-- Триггер для таблицы transactions
CREATE OR REPLACE FUNCTION trigger_refresh_operations()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_operations();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_operations_after_transaction_insert
    AFTER INSERT ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

CREATE TRIGGER refresh_operations_after_transaction_update
    AFTER UPDATE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

CREATE TRIGGER refresh_operations_after_transaction_delete
    AFTER DELETE ON transactions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

-- Триггеры для таблицы transfers
CREATE TRIGGER refresh_operations_after_transfer_insert
    AFTER INSERT ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

CREATE TRIGGER refresh_operations_after_transfer_update
    AFTER UPDATE ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

CREATE TRIGGER refresh_operations_after_transfer_delete
    AFTER DELETE ON transfers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_operations();

-- Первоначальное заполнение представления
REFRESH MATERIALIZED VIEW operations;
