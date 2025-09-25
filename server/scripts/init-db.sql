-- Aura Flow 数据库初始化脚本
-- 创建数据库和用户（如果不存在）

-- 创建数据库（如果不存在）
SELECT 'CREATE DATABASE aura_flow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aura_flow')\gexec

-- 创建用户（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aura_flow_user') THEN
        CREATE ROLE aura_flow_user WITH LOGIN PASSWORD 'your_secure_password';
    END IF;
END
$$;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE aura_flow TO aura_flow_user;

-- 连接到 aura_flow 数据库
\c aura_flow;

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO aura_flow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aura_flow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aura_flow_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aura_flow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aura_flow_user;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 设置时区
SET timezone = 'UTC';
