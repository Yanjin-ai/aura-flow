-- 数据库检查和修复脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 检查 users 表是否存在
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. 检查 tasks 表是否存在
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 3. 如果 users 表不存在，创建它
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  language VARCHAR(10) DEFAULT 'zh-CN',
  has_seen_welcome_guide BOOLEAN DEFAULT FALSE,
  auto_rollover_enabled BOOLEAN DEFAULT TRUE,
  auto_rollover_days INTEGER DEFAULT 3,
  rollover_notification_enabled BOOLEAN DEFAULT TRUE,
  ai_daily_insights BOOLEAN DEFAULT TRUE,
  ai_weekly_insights BOOLEAN DEFAULT TRUE,
  ai_url_extraction BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 如果 tasks 表不存在，创建它
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date DATE,
  due_time TIME,
  date DATE,
  order_index INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  ai_category VARCHAR(100),
  category VARCHAR(100),
  tags JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 检查 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'tasks');

-- 6. 启用 RLS（如果还没有启用）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略（如果不存在）
-- Users 表策略
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Tasks 表策略
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 8. 测试插入数据
INSERT INTO users (email, name, password_hash) 
VALUES ('test@example.com', 'Test User', 'test123')
ON CONFLICT (email) DO NOTHING;

-- 9. 检查插入结果
SELECT * FROM users WHERE email = 'test@example.com';

-- 10. 清理测试数据
DELETE FROM users WHERE email = 'test@example.com';
