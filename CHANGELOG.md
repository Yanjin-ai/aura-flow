# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AI 成本护栏与观测系统
- 灾难恢复演练自动化
- 合规与前端提示功能
- CI 保护与回滚机制
- 版本化与发布产物管理
- 健康与就绪信号检查
- 发布前自检与发布后验证
- 安全与风控补强
- 运营与可观测增强

### Changed
- 更新 Prisma Schema 支持 PostgreSQL
- 增强安全中间件配置
- 优化 Docker 配置支持生产环境
- 改进错误处理和日志记录

### Fixed
- 修复 CORS 配置问题
- 修复数据库连接池配置
- 修复 AI 服务降级逻辑

### Security
- 添加 Helmet 安全头配置
- 实现速率限制和熔断器
- 增强 JWT 令牌管理
- 添加 CSP 内容安全策略

## [1.0.0-rc.1] - 2024-01-01

### Added
- 初始版本发布
- 基础任务管理功能
- AI 洞察生成功能
- 用户认证系统
- 数据管理功能
- 监控面板
- 实验功能开关

### Changed
- 从 Base44 平台迁移到自托管
- 重构前端架构支持懒加载
- 优化后端 API 设计

### Fixed
- 修复初始部署问题
- 修复数据库迁移脚本
- 修复前端路由配置

## [0.9.0] - 2023-12-15

### Added
- 基础功能开发
- 用户界面设计
- 数据库设计
- API 接口开发

### Changed
- 项目架构设计
- 技术栈选型

## [0.8.0] - 2023-12-01

### Added
- 项目初始化
- 基础框架搭建
- 开发环境配置

---

## 版本说明

### 版本号格式
- `MAJOR.MINOR.PATCH` (如 1.0.0)
- `MAJOR.MINOR.PATCH-rc.N` (如 1.0.0-rc.1) - 发布候选版本
- `MAJOR.MINOR.PATCH-beta.N` (如 1.0.0-beta.1) - 测试版本

### 变更类型
- `Added` - 新功能
- `Changed` - 对现有功能的更改
- `Deprecated` - 即将删除的功能
- `Removed` - 已删除的功能
- `Fixed` - 错误修复
- `Security` - 安全相关修复

### 自动生成
本 CHANGELOG 通过 `scripts/changelog.sh` 脚本自动生成和更新。
