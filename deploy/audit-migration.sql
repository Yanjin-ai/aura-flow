-- 审计日志表迁移脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- 创建复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON audit_logs(event_type, timestamp);

-- 启用行级安全
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 管理员可以查看所有审计日志
CREATE POLICY "Admin can view all audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 用户只能查看自己的审计日志
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 系统可以插入审计日志
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 创建审计日志清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- 删除 90 天前的审计日志
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- 记录清理操作
  INSERT INTO audit_logs (event_type, details, severity)
  VALUES (
    'system_cleanup',
    jsonb_build_object(
      'operation', 'cleanup_old_audit_logs',
      'deleted_count', ROW_COUNT
    ),
    'info'
  );
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务（需要 pg_cron 扩展）
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();');
