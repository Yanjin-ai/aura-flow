import { apiClient } from '../lib/apiClient.js';

// 导出实体操作接口（使用新的平台适配层）
export const Task = apiClient.entities.Task;

export const Insight = apiClient.entities.Insight;

export const Reflection = apiClient.entities.Reflection;

export const InsightFeedback = apiClient.entities.InsightFeedback;

// 认证服务接口
export const User = apiClient.auth;