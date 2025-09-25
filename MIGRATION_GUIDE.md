# Aura Flow 迁移指南

## 概述

本指南详细说明了如何从 Base44 平台迁移到自建服务，实现完全脱离 Base 平台的本地化部署。

## 🎯 迁移目标

- ✅ 移除所有 Base44 SDK 依赖
- ✅ 实现自建后端 API 服务
- ✅ 支持多 AI 提供方切换
- ✅ 完整的错误处理和监控
- ✅ 生产就绪的 CI/CD 流程

## 📋 变更清单

### P0 优先级（已完成）

#### 1. 平台适配层 ✅
- [x] 创建 `src/lib/platform/` 适配层
- [x] 实现 `auth`, `storage`, `db`, `ai`, `telemetry` 五类接口
- [x] 支持开发环境 Mock 和生产环境真实服务

#### 2. 环境变量配置 ✅
- [x] 创建 `.env.example` 模板文件
- [x] 创建 `.env.local` 开发环境配置
- [x] 创建 `.env.production` 生产环境配置
- [x] 支持 AI 提供方、API 地址、监控等配置

#### 3. 后端服务骨架 ✅
- [x] 创建 Node.js/Express 后端服务
- [x] 集成 Prisma ORM 和 SQLite 数据库
- [x] 实现完整的 RESTful API
- [x] 配置 CORS 和安全中间件

#### 4. AI 提供方适配 ✅
- [x] 实现统一的 AI 服务接口
- [x] 支持 OpenAI、通义千问、Minimax 多厂商
- [x] 开发环境 Mock 实现
- [x] 统一的 `generateInsights` 和 `classifyTask` 接口

#### 5. 路由和调试页面 ✅
- [x] 修复路由配置，确保 DebugHome 可见
- [x] 增强 DebugHome 组件，提供系统状态监控
- [x] 添加 API 健康检查和快速导航

#### 6. 错误处理和日志 ✅
- [x] 实现全局错误边界组件
- [x] 集成遥测服务（支持 Sentry）
- [x] 网络错误处理和用户友好提示
- [x] 结构化日志记录

#### 7. CI/CD 流程 ✅
- [x] 创建 GitHub Actions 工作流
- [x] 前端构建、测试、E2E 测试
- [x] 后端构建、测试、安全扫描
- [x] Docker 容器化配置
- [x] 多环境部署支持

## 🔄 迁移映射表

### Base44 → 自建接口映射

| Base44 接口 | 自建接口 | 说明 |
|------------|---------|------|
| `base44.auth.me()` | `authService.me()` | 用户信息获取 |
| `base44.auth.updateMyUserData()` | `authService.updateUser()` | 用户信息更新 |
| `base44.entities.Task.*` | `databaseService.tasks.*` | 任务 CRUD 操作 |
| `base44.entities.Insight.*` | `databaseService.insights.*` | 洞察 CRUD 操作 |
| `base44.entities.Reflection.*` | `databaseService.reflections.*` | 反思 CRUD 操作 |
| `base44.integrations.Core.InvokeLLM` | `aiService.generateText()` | AI 文本生成 |
| `base44.integrations.Core.UploadFile` | `storageService.uploadFile()` | 文件上传 |

### 环境变量映射

| Base44 变量 | 新变量 | 说明 |
|------------|--------|------|
| `VITE_APP_ID` | `VITE_API_BASE_URL` | API 基础地址 |
| - | `VITE_AI_PROVIDER` | AI 提供方选择 |
| - | `VITE_AI_API_KEY` | AI 服务密钥 |
| - | `VITE_SENTRY_DSN` | 错误监控配置 |

## 🚀 部署指南

### 本地开发

1. **安装依赖**
   ```bash
   pnpm install
   cd server && pnpm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件
   ```

3. **启动后端服务**
   ```bash
   pnpm server:dev
   ```

4. **启动前端服务**
   ```bash
   pnpm dev
   ```

### Docker 部署

1. **开发环境**
   ```bash
   pnpm docker:dev
   ```

2. **生产环境**
   ```bash
   pnpm docker:prod
   ```

### 云平台部署

#### Vercel（前端）
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

#### Fly.io（后端）
1. 安装 Fly CLI
2. 运行 `fly deploy`
3. 配置环境变量

## 🔧 配置说明

### AI 提供方配置

```bash
# OpenAI
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo

# 通义千问
VITE_AI_PROVIDER=qwen
VITE_AI_API_KEY=your-qwen-key
VITE_AI_MODEL=qwen-turbo

# Minimax
VITE_AI_PROVIDER=minimax
VITE_AI_API_KEY=your-minimax-key
VITE_AI_MODEL=abab5.5-chat
```

### 监控配置

```bash
# Sentry 错误监控
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_TELEMETRY=true
```

## 📊 性能优化

### 前端优化
- 路由懒加载
- 组件按需加载
- 图片优化
- 代码分割

### 后端优化
- 数据库索引优化
- API 响应缓存
- 请求限流
- 连接池管理

## 🔒 安全考虑

### 认证安全
- JWT 令牌管理
- 密码加密存储
- 会话管理
- 权限控制

### API 安全
- CORS 配置
- 请求限流
- 输入验证
- SQL 注入防护

### 部署安全
- HTTPS 强制
- 安全头配置
- 环境变量保护
- 容器安全扫描

## 🧪 测试策略

### 单元测试
- 组件测试
- 工具函数测试
- API 接口测试

### 集成测试
- 端到端测试
- API 集成测试
- 数据库测试

### 性能测试
- 负载测试
- 压力测试
- 监控指标

## 📈 监控和运维

### 应用监控
- 错误追踪（Sentry）
- 性能监控
- 用户行为分析

### 基础设施监控
- 服务器资源监控
- 数据库性能监控
- 网络监控

### 日志管理
- 结构化日志
- 日志聚合
- 告警配置

## 🆘 故障排除

### 常见问题

1. **API 连接失败**
   - 检查 `VITE_API_BASE_URL` 配置
   - 确认后端服务运行状态
   - 检查网络连接

2. **AI 服务调用失败**
   - 验证 API 密钥配置
   - 检查 AI 提供方服务状态
   - 查看错误日志

3. **数据库连接问题**
   - 检查数据库 URL 配置
   - 确认数据库服务运行
   - 验证权限设置

### 调试工具

- DebugHome 页面：`/debug`
- API 健康检查：`/health`
- 详细健康检查：`/health/detailed`

## 📚 相关文档

- [API 文档](./docs/api.md)
- [部署文档](./docs/deployment.md)
- [开发指南](./docs/development.md)
- [故障排除](./docs/troubleshooting.md)

## 🎉 迁移完成检查清单

- [ ] 所有 Base44 依赖已移除
- [ ] 环境变量配置完成
- [ ] 后端服务正常运行
- [ ] 前端应用正常访问
- [ ] AI 服务调用正常
- [ ] 数据库操作正常
- [ ] 错误监控配置完成
- [ ] CI/CD 流程正常运行
- [ ] 生产环境部署成功
- [ ] 性能测试通过
- [ ] 安全扫描通过

---

**迁移完成时间**: 2024年1月
**版本**: v1.0.0
**维护者**: Aura Flow Team
