# 事故响应手册 (Incident Runbook)

## 概述
本文档提供了 Aura Flow 系统的事故响应流程、分级标准、通讯录和故障处理指南。

## 事故分级标准

### P0 - 严重事故 (Critical)
- **影响范围**: 所有用户无法访问系统
- **业务影响**: 核心业务完全中断
- **响应时间**: 15 分钟内
- **解决时间**: 1 小时内
- **示例**: 数据库完全宕机、所有服务不可用

### P1 - 高优先级事故 (High)
- **影响范围**: 大部分用户受影响
- **业务影响**: 核心功能严重受损
- **响应时间**: 30 分钟内
- **解决时间**: 4 小时内
- **示例**: 主要功能不可用、性能严重下降

### P2 - 中优先级事故 (Medium)
- **影响范围**: 部分用户受影响
- **业务影响**: 非核心功能受影响
- **响应时间**: 2 小时内
- **解决时间**: 24 小时内
- **示例**: 次要功能异常、轻微性能问题

### P3 - 低优先级事故 (Low)
- **影响范围**: 少数用户受影响
- **业务影响**: 边缘功能受影响
- **响应时间**: 24 小时内
- **解决时间**: 72 小时内
- **示例**: 非关键功能异常、用户体验问题

## 通讯录

### 核心团队
| 角色 | 姓名 | 电话 | 邮箱 | Slack |
|------|------|------|------|-------|
| 技术负责人 | 张三 | +86-138-0000-0001 | zhangsan@company.com | @zhangsan |
| 平台工程师 | 李四 | +86-138-0000-0002 | lisi@company.com | @lisi |
| 安全负责人 | 王五 | +86-138-0000-0003 | wangwu@company.com | @wangwu |
| 产品经理 | 赵六 | +86-138-0000-0004 | zhaoliu@company.com | @zhaoliu |

### 值班排班
| 周次 | 主值班 | 副值班 | 联系方式 |
|------|--------|--------|----------|
| 第1周 | 张三 | 李四 | 主: +86-138-0000-0001 |
| 第2周 | 李四 | 王五 | 主: +86-138-0000-0002 |
| 第3周 | 王五 | 赵六 | 主: +86-138-0000-0003 |
| 第4周 | 赵六 | 张三 | 主: +86-138-0000-0004 |

### 外部联系人
| 服务商 | 联系人 | 电话 | 邮箱 | 服务类型 |
|--------|--------|------|------|----------|
| 云服务商 | 技术支持 | +86-400-000-0000 | support@cloud.com | 基础设施 |
| 数据库服务 | 技术支持 | +86-400-000-0001 | db-support@cloud.com | 数据库 |
| CDN 服务 | 技术支持 | +86-400-000-0002 | cdn-support@cloud.com | CDN |
| 监控服务 | 技术支持 | +86-400-000-0003 | monitoring@cloud.com | 监控告警 |

## 事故响应流程

### 1. 事故发现
- **自动发现**: 监控系统告警
- **用户报告**: 用户反馈、客服转接
- **主动发现**: 日常巡检发现

### 2. 事故确认
- **确认影响范围**: 确定受影响的功能和用户
- **评估严重程度**: 根据分级标准确定事故级别
- **记录事故信息**: 创建事故工单

### 3. 事故响应
- **P0/P1**: 立即启动事故响应流程
- **P2/P3**: 按正常流程处理

### 4. 事故处理
- **故障三板斧**: 重启、回滚、扩容
- **根因分析**: 分析事故根本原因
- **临时修复**: 实施临时解决方案
- **永久修复**: 实施永久解决方案

### 5. 事故恢复
- **功能验证**: 确认功能恢复正常
- **监控确认**: 确认监控指标正常
- **用户通知**: 通知用户事故已解决

### 6. 事故总结
- **事故报告**: 编写事故报告
- **改进措施**: 制定改进措施
- **知识分享**: 团队知识分享

## 故障三板斧

### 第一斧：重启 (Restart)
```bash
# 重启后端服务
docker-compose restart api

# 重启前端服务
docker-compose restart frontend

# 重启数据库
docker-compose restart postgres

# 重启 Nginx
sudo systemctl restart nginx
```

### 第二斧：回滚 (Rollback)
```bash
# 回滚到上一个稳定版本
./scripts/rollback.sh --type full --tag stable --reason "事故回滚"

# 回滚数据库
./scripts/rollback.sh --type database --reason "数据库回滚"

# 回滚 Nginx 配置
./scripts/rollback.sh --type nginx --reason "Nginx 配置回滚"
```

### 第三斧：扩容 (Scale)
```bash
# 扩容后端服务
docker-compose up -d --scale api=3

# 扩容数据库连接池
# 修改 docker-compose.yml 中的数据库配置

# 启用 CDN 缓存
# 修改 Nginx 配置启用缓存
```

## 常见故障处理

### 数据库连接失败
```bash
# 检查数据库状态
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 重启数据库
docker-compose restart postgres

# 检查数据库连接
./scripts/verify-deploy.sh --api-url http://localhost:3001
```

### 服务内存不足
```bash
# 检查内存使用
docker stats

# 重启服务
docker-compose restart api

# 扩容服务
docker-compose up -d --scale api=2

# 检查内存限制
docker-compose config
```

### 网络连接问题
```bash
# 检查网络连接
ping api.yourdomain.com

# 检查 DNS 解析
nslookup api.yourdomain.com

# 检查防火墙
sudo ufw status

# 检查端口占用
netstat -tlnp | grep :3001
```

### AI 服务异常
```bash
# 检查 AI 服务状态
curl -f http://localhost:3001/readyz

# 切换到 Mock 模式
export AI_PROVIDER=mock
docker-compose restart api

# 检查 AI 配额
curl -f http://localhost:3001/monitoring/ai/cost
```

## 事故信息模板

### 事故通知模板
```
🚨 事故通知

事故级别: P0/P1/P2/P3
影响范围: [描述受影响的功能和用户]
开始时间: YYYY-MM-DD HH:MM:SS
预计恢复时间: YYYY-MM-DD HH:MM:SS
当前状态: 处理中/已解决
负责人: [姓名]
联系方式: [电话/邮箱]

详细描述:
[详细描述事故现象和影响]

处理进展:
[描述当前处理进展]

用户影响:
[描述对用户的具体影响]

后续更新:
[描述后续更新计划]
```

### 事故解决通知模板
```
✅ 事故解决通知

事故级别: P0/P1/P2/P3
影响范围: [描述受影响的功能和用户]
开始时间: YYYY-MM-DD HH:MM:SS
解决时间: YYYY-MM-DD HH:MM:SS
持续时间: X 小时 Y 分钟
负责人: [姓名]

解决方案:
[描述最终解决方案]

根因分析:
[描述事故根本原因]

改进措施:
[描述后续改进措施]

用户影响:
[描述对用户的具体影响]
```

## 监控告警

### 关键指标
- **可用性**: 99.9% 以上
- **响应时间**: P95 < 300ms
- **错误率**: < 1%
- **数据库连接**: 正常
- **AI 服务**: 正常或降级

### 告警阈值
- **CPU 使用率**: > 80%
- **内存使用率**: > 85%
- **磁盘使用率**: > 90%
- **网络延迟**: > 1000ms
- **错误率**: > 5%

### 告警处理
```bash
# 发送告警通知
./scripts/alert-webhook.sh system-alert "database" "critical" "数据库连接失败" "连接超时"

# 发送部署通知
./scripts/alert-webhook.sh deployment-success "v1.0.0" "production" "120"

# 发送 AI 预算告警
./scripts/alert-webhook.sh ai-budget-exceeded "daily" "3.5" "3.0" "116.7"
```

## 应急联系方式

### 内部通讯
- **Slack 频道**: #incident-response
- **微信群**: Aura Flow 事故响应群
- **邮件列表**: incident-response@company.com

### 外部通讯
- **用户通知**: 通过应用内通知和邮件
- **媒体声明**: 通过官方渠道发布
- **合作伙伴**: 通过邮件和电话通知

## 事故后处理

### 事故报告
- **事故概述**: 简要描述事故情况
- **时间线**: 详细的事故时间线
- **根因分析**: 事故根本原因分析
- **影响评估**: 对业务和用户的影响
- **解决方案**: 采取的解决方案
- **改进措施**: 后续改进措施

### 改进措施
- **技术改进**: 系统架构和代码改进
- **流程改进**: 事故响应流程改进
- **监控改进**: 监控和告警改进
- **培训改进**: 团队培训和知识分享

### 知识分享
- **团队分享**: 在团队会议上分享
- **文档更新**: 更新相关文档
- **最佳实践**: 总结最佳实践
- **经验教训**: 记录经验教训

## 附录

### 常用命令
```bash
# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f api

# 重启服务
docker-compose restart api

# 回滚服务
./scripts/rollback.sh --type full

# 验证部署
./scripts/verify-deploy.sh

# 发送告警
./scripts/alert-webhook.sh system-alert "service" "critical" "message" "details"
```

### 重要文件
- **配置文件**: docker-compose.yml, nginx.conf
- **脚本文件**: scripts/rollback.sh, scripts/verify-deploy.sh
- **监控配置**: 监控面板配置
- **日志文件**: 应用日志和系统日志

### 备份恢复
- **数据库备份**: 每日自动备份
- **配置文件备份**: 版本控制
- **代码备份**: Git 仓库
- **监控数据备份**: 监控系统备份
