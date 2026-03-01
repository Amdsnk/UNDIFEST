-- Fix user_id column to allow NULL for guest checkout
-- Run this in Railway Postgres console

-- 1. Check current constraint
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name = 'user_id';

-- 2. Drop NOT NULL constraint
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;

-- 3. Verify the change
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name = 'user_id';

-- Expected result: is_nullable should be 'YES'

-- 4. Test with a sample query (optional)
-- This should now work without error:
-- INSERT INTO transactions (event_id, amount, ticket_count, phone_number, event_name, payment_status)
-- VALUES ('test-event-id', 10000, 1, '081234567890', 'Test Event', 'pending');

