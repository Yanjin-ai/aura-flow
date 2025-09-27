/**
 * 认证服务适配层
 * 抽象化用户认证相关操作
 */

import { getPlatformConfig } from './config';

export interface User {
  id: string;
  email?: string;
  name?: string;
  has_seen_welcome_guide: boolean;
  language: string;
  auto_rollover_enabled: boolean;
  auto_rollover_days: number;
  rollover_notification_enabled: boolean;
  ai_daily_insights: boolean;
  ai_weekly_insights: boolean;
  ai_url_extraction: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  verification_code?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

/**
 * 认证服务接口
 */
export interface AuthService {
  // 获取当前用户信息
  me(): Promise<User>;
  
  // 用户登录
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  
  // 用户注册
  register(userData: { name: string; email: string; password: string }): Promise<AuthResponse>;
  
  // 用户登出
  logout(): Promise<void>;
  
  // 更新用户信息
  updateUser(userData: Partial<User>): Promise<User>;
  
  // 检查认证状态
  isAuthenticated(): Promise<boolean>;
}

/**
 * 创建认证服务实例
 */
export function createAuthService(): AuthService {
  const config = getPlatformConfig();
  
  // 如果有 Supabase 配置，使用真实 API
  if (config.environment === 'production' && import.meta.env.VITE_SUPABASE_URL) {
    return new ApiAuthService(config);
  }
  
  // 否则使用 Mock 服务
  return new MockAuthService();
}

/**
 * Mock 认证服务（开发环境使用）
 */
class MockAuthService implements AuthService {
  private getDefaultUser(): User {
    return {
      id: 'mock-user-id',
      email: 'dev@example.com',
      name: '开发用户',
      has_seen_welcome_guide: true,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 3,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  async me(): Promise<User> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 从本地存储读取用户信息，如果没有则返回默认用户
    const storedUser = localStorage.getItem('mock_user_data');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    return this.getDefaultUser();
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 从本地存储读取用户信息，如果没有则创建新用户
    let user = this.getDefaultUser();
    const storedUser = localStorage.getItem('mock_user_data');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
    
    const response = {
      user: { ...user, email: credentials.email },
      token: 'mock-jwt-token',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // 保存 token 和用户信息到本地存储
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('mock_user_data', JSON.stringify(response.user));
    
    return response;
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newUser = {
      ...this.getDefaultUser(),
      id: `mock-user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const response = {
      user: newUser,
      token: 'mock-jwt-token',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // 保存 token 和用户信息到本地存储
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('mock_user_data', JSON.stringify(response.user));
    
    return response;
  }
  
  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // 清除本地存储的 token 和用户信息
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_user_data');
  }
  
  async updateUser(userData: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 从本地存储读取当前用户信息
    const currentUser = await this.me();
    const updatedUser = { ...currentUser, ...userData, updated_at: new Date().toISOString() };
    
    // 保存更新后的用户信息到本地存储
    localStorage.setItem('mock_user_data', JSON.stringify(updatedUser));
    
    return updatedUser;
  }
  
  async isAuthenticated(): Promise<boolean> {
    // 检查本地存储中是否有有效的 token
    const token = localStorage.getItem('auth_token');
    return !!token;
  }
}

/**
 * API 认证服务（生产环境使用）
 */
class ApiAuthService implements AuthService {
  constructor(private config: any) {}
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 使用相对路径，指向 Vercel API 路由
    const url = `/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 如果 API 返回的是包装格式 { success: true, data: ... }，则提取 data
    if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
      return result.data;
    }
    
    return result;
  }
  
  async me(): Promise<User> {
    return this.request<User>('/auth/me-mock');
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await this.request<any>('/auth/login-mock', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // 认证 API 返回 { success: true, user: ..., token: ..., expires_at: ... }
    const response = result && typeof result === 'object' && 'success' in result && 'user' in result
      ? {
          user: result.user,
          token: result.token,
          expires_at: result.expires_at
        }
      : result;
    
    // 保存 token
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    console.log('注册请求数据:', userData);
    const result = await this.request<any>('/auth/register-debug', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // 认证 API 返回 { success: true, user: ..., token: ..., expires_at: ... }
    const response = result && typeof result === 'object' && 'success' in result && 'user' in result
      ? {
          user: result.user,
          token: result.token,
          expires_at: result.expires_at
        }
      : result;
    
    // 保存 token
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }
  
  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
  }
  
  async updateUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  }
  
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  }
}

// 导出默认实例
export const authService = createAuthService();
