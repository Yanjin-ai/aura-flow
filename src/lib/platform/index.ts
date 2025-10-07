/**
 * 平台适配层 - 统一导出所有平台相关接口
 * 提供统一的平台服务接口，支持多厂商切换
 */

// 认证相关接口
export * from './auth';

// 数据存储相关接口  
export * from './storage';

// 数据库相关接口
export * from './db';
export * from './db-direct';

// AI 服务相关接口
export * from './ai';

// 遥测和监控相关接口
export * from './telemetry';

// 平台配置
export * from './config';
