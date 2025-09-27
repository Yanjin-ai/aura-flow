-- 任务表结构迁移脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 添加新字段到 tasks 表
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_time TIME,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 将现有的 content 字段值复制到 title 字段
UPDATE tasks SET title = content WHERE title IS NULL;

-- 设置 title 字段为 NOT NULL
ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;

-- 更新现有记录的 status 字段
UPDATE tasks SET status = CASE 
  WHEN completed = true THEN 'completed'
  ELSE 'pending'
END;

-- 更新现有记录的 priority 字段
-- 先删除旧的 priority 列，然后重新添加为 VARCHAR 类型
ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
UPDATE tasks SET priority = 'medium';

-- 更新现有记录的 ai_category 字段
UPDATE tasks SET ai_category = category WHERE category IS NOT NULL;

-- 更新现有记录的 date 字段
UPDATE tasks SET date = due_date::date WHERE due_date IS NOT NULL;

-- 删除旧的 priority 列（如果它是 integer 类型）
-- ALTER TABLE tasks DROP COLUMN IF EXISTS priority;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);
