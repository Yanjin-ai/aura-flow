/**
 * 平台适配层 - 统一导出所有平台相关接口
 * 用于抽象化 Base44 依赖，支持后续替换为自建服务
 */

// 认证相关接口
export * from './auth';

// 数据存储相关接口  
export * from './storage';

// 数据库相关接口
export * from './db';

// AI 服务相关接口
export * from './ai';

// 遥测和监控相关接口
export * from './telemetry';

// 平台配置
export * from './config';
