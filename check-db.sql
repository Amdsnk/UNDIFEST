-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check admin users
SELECT id, username, created_at FROM admin_users;

-- Check events count
SELECT COUNT(*) as event_count FROM events;

-- Check users count
SELECT COUNT(*) as user_count FROM users;

