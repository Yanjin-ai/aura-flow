# 任务清单

## P0 - 关键安全修复 (立即执行)

### 1. 环境变量化硬编码密钥
**文件**: `src/api/base44Client.js`
**问题**: App ID 硬编码在代码中
**任务**:
- [ ] 创建 `.env.example` 文件
- [ ] 创建 `.env.local` 文件
- [ ] 修改 `base44Client.js` 使用环境变量
- [ ] 更新 `.gitignore` 忽略 `.env.local`
- [ ] 更新 `vite.config.js` 支持环境变量

**命令**:
```bash
# 创建环境变量文件
echo "VITE_BASE44_APP_ID=your_app_id_here" > .env.example
echo "VITE_BASE44_APP_ID=6898970f36db14102a15d3b4" > .env.local
```

### 2. 移除生产环境调试代码
**问题**: 50+ 个 console.log/error/warn 语句
**任务**:
- [ ] 移除所有 console.log 语句
- [ ] 将 console.error 替换为适当的错误处理
- [ ] 添加开发环境专用的调试工具
- [ ] 配置 ESLint 规则禁止 console 语句

**影响文件**:
- `src/pages/Settings.jsx`
- `src/pages/DayView.jsx` 
- `src/pages/Insights.jsx`
- `src/components/ai/` 目录下所有文件
- `src/components/FeedbackWidget.jsx`
- `src/components/FeedbackModal.jsx`
- `src/components/SmartTaskInput.jsx`
- `src/components/PendingTasksPanel.jsx`
- `src/components/ReflectionEditor.jsx`
- `src/components/i18n/LanguageContext.jsx`
- `src/components/utils/naturalLanguageParser.jsx`

### 3. 修复 CORS 安全配置
**文件**: `vite.config.js`
**问题**: `allowedHosts: true` 过于宽松
**任务**:
- [ ] 限制允许的主机列表
- [ ] 添加生产环境配置
- [ ] 配置代理规则

## P1 - 开发体验改进 (本周内完成)

### 4. 添加 Prettier 配置
**任务**:
- [ ] 安装 Prettier: `npm install --save-dev prettier`
- [ ] 创建 `.prettierrc` 配置文件
- [ ] 创建 `.prettierignore` 文件
- [ ] 添加 `format` 脚本到 package.json
- [ ] 配置 ESLint 与 Prettier 集成
- [ ] 格式化所有现有代码

**配置文件**:
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 5. 迁移到 TypeScript
**任务**:
- [ ] 安装 TypeScript: `npm install --save-dev typescript @types/react @types/react-dom`
- [ ] 创建 `tsconfig.json` 配置文件
- [ ] 重命名 `.jsx` 文件为 `.tsx`
- [ ] 添加类型定义
- [ ] 配置 Vite 支持 TypeScript
- [ ] 添加 `type-check` 脚本

### 6. 添加测试配置
**任务**:
- [ ] 安装 Vitest: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`
- [ ] 创建 `vitest.config.js` 配置文件
- [ ] 添加 `test` 脚本到 package.json
- [ ] 创建测试示例文件
- [ ] 配置测试覆盖率

### 7. 容器化配置
**任务**:
- [ ] 创建 `Dockerfile`
- [ ] 创建 `docker-compose.yml`
- [ ] 创建 `.dockerignore` 文件
- [ ] 配置多阶段构建
- [ ] 添加健康检查

**Dockerfile 示例**:
```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## P2 - 代码质量与性能优化 (本月内完成)

### 8. 添加 CI/CD 配置
**任务**:
- [ ] 创建 `.github/workflows/ci.yml`
- [ ] 配置自动测试
- [ ] 配置自动构建
- [ ] 配置自动部署
- [ ] 添加代码质量检查

### 9. 性能优化
**任务**:
- [ ] 配置代码分割
- [ ] 添加路由懒加载
- [ ] 优化 Bundle 大小
- [ ] 添加性能监控
- [ ] 配置缓存策略

### 10. 错误处理改进
**任务**:
- [ ] 创建全局错误边界
- [ ] 统一错误处理机制
- [ ] 添加错误日志记录
- [ ] 创建用户友好的错误页面
- [ ] 添加重试机制

### 11. 代码质量工具
**任务**:
- [ ] 配置 Husky 预提交钩子
- [ ] 配置 lint-staged
- [ ] 添加 commitlint
- [ ] 配置代码覆盖率检查
- [ ] 添加依赖安全审计

### 12. 文档完善
**任务**:
- [ ] 完善 README.md
- [ ] 添加 API 文档
- [ ] 创建开发指南
- [ ] 添加部署文档
- [ ] 创建故障排除指南

## 执行计划

### 第1周 (P0 任务)
- [ ] 完成环境变量配置
- [ ] 移除所有调试代码
- [ ] 修复 CORS 配置

### 第2周 (P1 任务 - 前半部分)
- [ ] 添加 Prettier 配置
- [ ] 开始 TypeScript 迁移

### 第3周 (P1 任务 - 后半部分)
- [ ] 完成 TypeScript 迁移
- [ ] 添加测试配置
- [ ] 创建容器化配置

### 第4周 (P2 任务 - 开始)
- [ ] 添加 CI/CD 配置
- [ ] 开始性能优化

## 验收标准

### P0 任务验收
- [ ] 所有敏感信息使用环境变量
- [ ] 生产构建无 console 语句
- [ ] CORS 配置安全

### P1 任务验收
- [ ] 代码格式化一致
- [ ] TypeScript 编译无错误
- [ ] 测试通过率 > 80%
- [ ] Docker 镜像构建成功

### P2 任务验收
- [ ] CI/CD 流水线正常运行
- [ ] 性能指标达标
- [ ] 错误处理完善
- [ ] 文档完整

## 工具推荐

### 开发工具
- **IDE**: VS Code + 相关插件
- **调试**: React Developer Tools
- **性能**: Lighthouse, Bundle Analyzer

### 代码质量
- **格式化**: Prettier
- **检查**: ESLint + TypeScript
- **测试**: Vitest + Testing Library
- **提交**: Husky + lint-staged

### 部署工具
- **容器**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **监控**: Sentry (错误监控)

## 注意事项

1. **向后兼容**: 确保所有更改不影响现有功能
2. **渐进式迁移**: TypeScript 迁移可以逐步进行
3. **测试优先**: 在重构前先添加测试
4. **文档同步**: 及时更新相关文档
5. **团队协作**: 确保团队成员了解新的开发流程
