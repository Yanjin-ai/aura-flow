# 🌟 Aura Flow

一个现代化的任务管理和 AI 洞察生成应用，帮助用户提高工作效率和获得智能建议。

## ✨ 特性

- 📝 **智能任务管理** - 创建、分类、跟踪任务进度
- 🤖 **AI 洞察生成** - 基于任务数据生成每日/每周洞察
- 📊 **数据分析** - 任务完成统计和效率分析
- 🤔 **反思记录** - 记录工作反思和心情变化
- 🔄 **多平台支持** - 支持多种 AI 提供方切换
- 🚀 **现代化架构** - React + Vite + Node.js + Prisma
- 🐳 **容器化部署** - Docker 支持，一键部署
- 📱 **响应式设计** - 支持桌面和移动设备

## 🏗️ 技术栈

### 前端
- **React 18** - 现代化 UI 框架
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Radix UI** - 无障碍组件库
- **React Query** - 数据获取和状态管理
- **React Router** - 客户端路由

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 应用框架
- **Prisma** - 现代化 ORM
- **SQLite/PostgreSQL** - 数据库
- **JWT** - 身份认证
- **Winston** - 日志记录

### AI 集成
- **OpenAI** - GPT 模型支持
- **通义千问** - 阿里云 AI 服务
- **Minimax** - 国产 AI 模型
- **Mock 模式** - 开发环境模拟

### 部署和运维
- **Docker** - 容器化
- **GitHub Actions** - CI/CD
- **Nginx** - 反向代理
- **Sentry** - 错误监控

## 🔒 CI 通过标准

为确保代码质量和安全性，所有代码必须通过以下检查：

### 代码质量
- ✅ **代码扫描** - GitHub CodeQL 分析通过（JavaScript/TypeScript + Docker）
- ✅ **容器扫描** - Trivy 安全扫描通过（依赖、镜像、配置）
- ✅ **单元测试** - 测试覆盖率 > 80%
- ✅ **E2E 测试** - 端到端测试全部通过
- ✅ **性能测试** - k6 压测满足性能阈值

### 安全要求
- ✅ **依赖安全** - 无高危/严重漏洞
- ✅ **镜像安全** - Docker 镜像无安全风险
- ✅ **配置安全** - 配置文件符合安全最佳实践
- ✅ **代码安全** - 无安全漏洞和代码异味

### 性能阈值
- ✅ **错误率** - HTTP 请求失败率 < 1%
- ✅ **响应时间** - 95% 请求响应时间 < 300ms
- ✅ **检查通过率** - 所有检查项通过率 > 99%

**注意**: 任何一项检查失败都会阻止代码合并和部署。

## 🚨 紧急维护模式 (Panic Mode)

在系统出现严重故障时，可以快速启用维护模式：

### 启用维护模式
```bash
# 启用维护模式
./scripts/panic-mode.sh --enable
```

### 禁用维护模式
```bash
# 禁用维护模式
./scripts/panic-mode.sh --disable
```

### 检查维护模式状态
```bash
# 检查当前状态
./scripts/panic-mode.sh --status
```

### 维护模式功能
- **Nginx 返回 503**: 所有用户请求返回维护页面
- **AI 服务降级**: 自动切换到 Mock 模式
- **限速加严**: 加强访问限制
- **告警通知**: 自动发送维护模式通知
- **健康检查**: 保持监控端点可用

## 🚀 快速开始

### 新用户指南
- 📖 [完整用户指南](docs/USER_GUIDE.md) - 详细功能介绍
- ⚡ [快速入门](docs/QUICK_START.md) - 3分钟上手
- 🗺️ [用户路径图](docs/USER_JOURNEY.md) - 使用流程图

### 部署指南
- 🚀 [部署指南](docs/DEPLOYMENT_GUIDE.md) - 公网部署方案
- 🌍 [全球部署策略](docs/GLOBAL_DEPLOYMENT_STRATEGY.md) - 面向全球用户
- 📋 [实施计划](docs/IMPLEMENTATION_PLAN.md) - 分阶段部署计划
- 💰 [成本分析](docs/COST_BREAKDOWN.md) - 详细成本计算
- 🤝 [任务分工](docs/DEPLOYMENT_TASKS.md) - 我能帮你做什么

### 方法一：一键启动脚本（推荐）

```bash
# 运行启动脚本（自动设置 NVM 环境）
./start.sh
```

### 方法二：手动安装

```bash
# 1. 安装依赖
pnpm install

# 2. 安装 pre-commit 钩子（推荐）
pre-commit install

# 3. 启动开发服务器
pnpm dev
```

### 方法二：自动设置脚本

```bash
# 运行自动设置脚本
./scripts/setup.sh
```

### 方法三：手动设置

1. **安装依赖**
   ```bash
   # 安装前端依赖
   pnpm install
   
   # 安装后端依赖
   cd server && pnpm install && cd ..
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件
   ```

3. **初始化数据库**
   ```bash
   pnpm server:db:generate
   pnpm server:db:push
   pnpm server:db:seed
   ```

4. **启动服务**
   ```bash
   # 启动后端服务
   pnpm server:dev
   
   # 启动前端服务（新终端）
   pnpm dev
   ```

5. **访问应用**
   - 前端: http://localhost:5173
   - 后端: http://localhost:3001
   - 调试页: http://localhost:5173/debug

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件并配置以下变量：

```bash
# 应用配置
VITE_APP_NAME=Aura Flow
VITE_BUILD_VERSION=1.0.0

# API 配置
VITE_API_BASE_URL=http://localhost:3001

# AI 服务配置
VITE_AI_PROVIDER=mock  # mock, openai, qwen, minimax
VITE_AI_API_KEY=your-api-key
VITE_AI_MODEL=gpt-3.5-turbo

# 监控配置
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_TELEMETRY=false
```

### AI 提供方配置

#### OpenAI
```bash
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

#### 通义千问
```bash
VITE_AI_PROVIDER=qwen
VITE_AI_API_KEY=your-qwen-key
VITE_AI_MODEL=qwen-turbo
```

#### Minimax
```bash
VITE_AI_PROVIDER=minimax
VITE_AI_API_KEY=your-minimax-key
VITE_AI_MODEL=abab5.5-chat
```

## 🐳 Docker 部署

### 开发环境
```bash
pnpm docker:dev
```

### 生产环境
```bash
pnpm docker:prod
```

### 自定义部署
```bash
# 构建镜像
pnpm docker:build

# 运行容器
pnpm docker:run
```

## 📋 可用脚本

### 前端脚本
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览构建结果
pnpm lint         # 代码检查
pnpm test         # 运行测试
pnpm playwright   # E2E 测试
```

### 后端脚本
```bash
pnpm server:dev           # 启动后端开发服务器
pnpm server:start         # 启动后端生产服务器
pnpm server:db:generate   # 生成 Prisma 客户端
pnpm server:db:push       # 推送数据库模式
pnpm server:db:seed       # 填充示例数据
pnpm server:db:reset      # 重置数据库
```

### Docker 脚本
```bash
pnpm docker:build  # 构建 Docker 镜像
pnpm docker:run    # 运行 Docker 容器
pnpm docker:dev    # 启动开发环境
pnpm docker:prod   # 启动生产环境
pnpm docker:down   # 停止所有容器
```

## 🏗️ 项目结构

```
aura-flow/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具库
│   │   └── platform/      # 平台适配层
│   └── hooks/             # 自定义 Hooks
├── server/                # 后端源码
│   ├── src/               # 服务器代码
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   └── services/      # 业务服务
│   └── prisma/            # 数据库模式
├── .github/               # GitHub Actions
├── scripts/               # 脚本文件
├── docs/                  # 文档
└── tests/                 # 测试文件
```

## 🔌 API 接口

### 认证接口
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/me` - 获取当前用户信息
- `PATCH /auth/me` - 更新用户信息

### 任务接口
- `GET /tasks` - 获取任务列表
- `POST /tasks` - 创建任务
- `PATCH /tasks/:id` - 更新任务
- `DELETE /tasks/:id` - 删除任务

### 洞察接口
- `GET /insights` - 获取洞察列表
- `POST /insights` - 创建洞察
- `POST /insights/:id/feedback` - 提交反馈

### 反思接口
- `GET /reflections` - 获取反思列表
- `POST /reflections` - 创建反思
- `PATCH /reflections/:id` - 更新反思

## 🧪 测试

### 运行测试
```bash
# 单元测试
pnpm test

# E2E 测试
pnpm playwright

# 测试覆盖率
pnpm test:coverage
```

### 测试策略
- **单元测试** - 组件和工具函数测试
- **集成测试** - API 接口测试
- **E2E 测试** - 端到端用户流程测试

## 📊 监控和日志

### 错误监控
- 集成 Sentry 进行错误追踪
- 全局错误边界处理
- 用户友好的错误提示

### 性能监控
- API 响应时间监控
- 前端性能指标
- 数据库查询优化

### 日志管理
- 结构化日志记录
- 不同级别的日志输出
- 日志轮转和归档

## 🔒 安全考虑

### 认证安全
- JWT 令牌管理
- 密码加密存储
- 会话超时处理

### API 安全
- CORS 配置
- 请求限流
- 输入验证
- SQL 注入防护

### 部署安全
- HTTPS 强制
- 安全头配置
- 环境变量保护

## 🚀 部署指南

### 云平台部署

#### Vercel（前端）
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

#### Fly.io（后端）
1. 安装 Fly CLI
2. 运行 `fly deploy`
3. 配置环境变量

#### Railway
1. 连接 GitHub 仓库
2. 选择服务类型
3. 配置环境变量

### 自托管部署

#### 使用 Docker Compose
```bash
# 生产环境部署
pnpm docker:prod

# 查看日志
docker-compose logs -f
```

#### 手动部署
1. 构建前端应用
2. 配置 Nginx
3. 启动后端服务
4. 配置数据库

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

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

- **调试页面**: `/debug` - 系统状态监控
- **健康检查**: `/health` - API 健康状态
- **详细检查**: `/health/detailed` - 详细系统信息

### 获取帮助

- 📖 查看 [迁移指南](MIGRATION_GUIDE.md)
- 🛠️ 查看 [故障排除指南](docs/troubleshooting.md)
- 🐛 提交 [Issue](https://github.com/your-repo/issues)
- 💬 加入讨论 [Discussions](https://github.com/your-repo/discussions)

## 🎯 路线图

### 即将推出
- [ ] 移动端应用
- [ ] 团队协作功能
- [ ] 更多 AI 模型支持
- [ ] 数据导出功能
- [ ] 主题定制

### 长期计划
- [ ] 插件系统
- [ ] 第三方集成
- [ ] 高级分析功能
- [ ] 多语言支持

---

**Aura Flow** - 让工作更智能，让效率更高效 🚀