# 回滚演练步骤

## 概述
本文档描述了 Aura Flow 系统的回滚演练步骤，确保在紧急情况下能够快速、安全地回滚到稳定版本。

## 演练目标
- 验证回滚脚本的可用性和正确性
- 确保团队熟悉回滚流程
- 测试不同回滚场景的响应时间
- 验证回滚后的系统稳定性

## 演练环境
- **Staging 环境**: 用于演练测试
- **生产环境**: 仅在紧急情况下使用

## 回滚类型

### 1. 镜像回滚 (image)
回滚到上一个稳定的 Docker 镜像版本。

```bash
# 基本用法
./scripts/rollback.sh --type image --tag v1.0.0 --reason "演练测试"

# 自动确认
./scripts/rollback.sh --type image --tag v1.0.0 --reason "演练测试" --yes
```

### 2. Nginx 回滚 (nginx)
回滚 Nginx 配置到备份版本。

```bash
./scripts/rollback.sh --type nginx --reason "Nginx 配置问题"
```

### 3. 数据库回滚 (database)
回滚数据库迁移。

```bash
./scripts/rollback.sh --type database --reason "数据库迁移问题"
```

### 4. Upstream 切换 (upstream)
一键切换 Nginx upstream 到 api_v1。

```bash
./scripts/rollback.sh --type upstream --reason "快速切换"
```

### 5. 完整回滚 (full)
执行完整的回滚流程，包括镜像、数据库等。

```bash
./scripts/rollback.sh --type full --tag v1.0.0 --reason "严重问题"
```

## 演练步骤

### 准备阶段
1. **环境检查**
   ```bash
   # 检查 staging 环境状态
   curl -f https://staging.yourdomain.com/healthz
   
   # 检查当前版本
   curl -f https://staging.yourdomain.com/status
   ```

2. **备份当前状态**
   ```bash
   # 备份当前配置
   cp docker-compose.staging.yml docker-compose.staging.yml.backup
   
   # 记录当前版本
   echo "$(date): 当前版本 $(docker-compose -f docker-compose.staging.yml config | grep image:)" >> rollback-drill.log
   ```

### 演练执行

#### 场景 1: 镜像回滚演练
```bash
# 1. 部署一个测试版本
docker-compose -f docker-compose.staging.yml up -d

# 2. 验证部署
./scripts/verify-deploy.sh --api-url https://api-staging.yourdomain.com

# 3. 执行回滚
./scripts/rollback.sh --type image --tag v1.0.0 --reason "演练测试" --yes

# 4. 验证回滚结果
./scripts/verify-deploy.sh --api-url https://api-staging.yourdomain.com

# 5. 记录结果
echo "$(date): 镜像回滚演练完成" >> rollback-drill.log
```

#### 场景 2: Nginx 回滚演练
```bash
# 1. 修改 Nginx 配置（模拟问题）
cp deploy/nginx.staging.conf deploy/nginx.staging.conf.backup
echo "invalid_config" >> deploy/nginx.staging.conf

# 2. 重新加载 Nginx
nginx -s reload

# 3. 验证问题
curl -f https://staging.yourdomain.com/healthz || echo "配置错误确认"

# 4. 执行回滚
./scripts/rollback.sh --type nginx --reason "Nginx 配置演练"

# 5. 验证恢复
curl -f https://staging.yourdomain.com/healthz

# 6. 记录结果
echo "$(date): Nginx 回滚演练完成" >> rollback-drill.log
```

#### 场景 3: Upstream 切换演练
```bash
# 1. 切换到 api_v2
./deploy/switch_upstream.sh --target api_v2

# 2. 验证切换
curl -f https://staging.yourdomain.com/healthz

# 3. 执行回滚
./scripts/rollback.sh --type upstream --reason "Upstream 切换演练"

# 4. 验证恢复
curl -f https://staging.yourdomain.com/healthz

# 5. 记录结果
echo "$(date): Upstream 切换演练完成" >> rollback-drill.log
```

### 验证阶段
1. **功能验证**
   ```bash
   # 运行完整的验证脚本
   ./scripts/verify-deploy.sh --api-url https://api-staging.yourdomain.com
   ```

2. **性能验证**
   ```bash
   # 运行性能测试
   pnpm perf:smoke
   ```

3. **监控验证**
   ```bash
   # 检查监控指标
   curl -f https://api-staging.yourdomain.com/metrics
   ```

### 恢复阶段
1. **恢复原始状态**
   ```bash
   # 恢复配置
   cp docker-compose.staging.yml.backup docker-compose.staging.yml
   
   # 重新部署
   docker-compose -f docker-compose.staging.yml up -d
   ```

2. **最终验证**
   ```bash
   # 验证系统完全恢复
   ./scripts/verify-deploy.sh --api-url https://api-staging.yourdomain.com
   ```

## 演练检查清单

### 演练前检查
- [ ] Staging 环境可用
- [ ] 回滚脚本可执行
- [ ] 备份文件完整
- [ ] 监控系统正常
- [ ] 团队通知完成

### 演练中检查
- [ ] 回滚脚本执行成功
- [ ] 系统状态正常
- [ ] 功能验证通过
- [ ] 性能指标正常
- [ ] 监控数据正确

### 演练后检查
- [ ] 系统完全恢复
- [ ] 演练日志完整
- [ ] 问题记录详细
- [ ] 改进建议明确
- [ ] 团队总结完成

## 演练时间目标

| 回滚类型 | 目标时间 (RTO) | 实际时间 | 状态 |
|---------|---------------|----------|------|
| 镜像回滚 | 5 分钟 | | |
| Nginx 回滚 | 2 分钟 | | |
| 数据库回滚 | 10 分钟 | | |
| Upstream 切换 | 1 分钟 | | |
| 完整回滚 | 15 分钟 | | |

## 常见问题与解决方案

### 问题 1: 回滚脚本执行失败
**症状**: 脚本返回非零退出码
**解决方案**:
1. 检查环境变量配置
2. 验证 Docker 服务状态
3. 检查文件权限
4. 查看详细错误日志

### 问题 2: 回滚后服务无法启动
**症状**: 服务启动失败或健康检查失败
**解决方案**:
1. 检查 Docker 镜像是否存在
2. 验证环境变量配置
3. 检查端口冲突
4. 查看容器日志

### 问题 3: 数据库回滚失败
**症状**: 数据库迁移回滚失败
**解决方案**:
1. 检查数据库连接
2. 验证迁移文件完整性
3. 手动执行迁移回滚
4. 联系数据库管理员

## 演练报告模板

### 演练基本信息
- **演练日期**: 
- **演练类型**: 
- **参与人员**: 
- **演练环境**: 

### 演练结果
- **执行时间**: 
- **成功/失败**: 
- **主要问题**: 
- **解决时间**: 

### 改进建议
- **脚本优化**: 
- **流程改进**: 
- **文档更新**: 
- **培训需求**: 

### 下次演练计划
- **计划日期**: 
- **演练类型**: 
- **重点关注**: 

## 紧急回滚流程

### 生产环境紧急回滚
1. **立即评估**
   - 问题严重程度
   - 影响范围
   - 回滚必要性

2. **快速回滚**
   ```bash
   # 一键回滚到稳定版本
   ./scripts/rollback.sh --type full --tag stable --reason "紧急回滚" --yes
   ```

3. **验证恢复**
   ```bash
   # 快速验证
   curl -f https://yourdomain.com/healthz
   ```

4. **通知团队**
   ```bash
   # 发送告警通知
   ./scripts/alert-webhook.sh system-alert "deployment" "critical" "紧急回滚执行" "生产环境已回滚到稳定版本"
   ```

### 回滚后处理
1. **问题分析**
   - 根本原因分析
   - 影响评估
   - 修复计划

2. **系统监控**
   - 持续监控系统状态
   - 关注关键指标
   - 准备二次回滚

3. **团队沟通**
   - 通知相关团队
   - 更新状态页面
   - 准备用户通知

## 总结
回滚演练是确保系统稳定性的重要环节。通过定期演练，我们可以：
- 验证回滚流程的有效性
- 提高团队的应急响应能力
- 发现和解决潜在问题
- 优化回滚流程和工具

建议每月进行一次完整的回滚演练，确保在紧急情况下能够快速、安全地恢复系统。
