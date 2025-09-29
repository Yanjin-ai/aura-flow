-- OAuth 支持迁移脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 为用户表添加 OAuth 相关字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS github_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);

-- 更新现有用户，设置默认的 OAuth 提供商
UPDATE users 
SET oauth_provider = 'email' 
WHERE oauth_provider IS NULL;

-- 添加唯一约束（可选，如果需要确保每个 OAuth 提供商只能有一个账户）
-- ALTER TABLE users ADD CONSTRAINT unique_google_id UNIQUE (google_id);
-- ALTER TABLE users ADD CONSTRAINT unique_github_id UNIQUE (github_id);
