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
  
  // 根据配置选择实现方式
  // 只要选择了 mock 提供商，则无论环境直接使用 MockAuthService，避免误连真实后端
  if (config.ai_provider === 'mock') {
    return new MockAuthService();
  }
  
  return new ApiAuthService(config);
}

/**
 * Mock 认证服务（开发环境使用）
 */
class MockAuthService implements AuthService {
  private mockUser: User = {
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
  
  async me(): Promise<User> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...this.mockUser };
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = {
      user: { ...this.mockUser, email: credentials.email },
      token: 'mock-jwt-token',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // 保存 token 到本地存储
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newUser = {
      ...this.mockUser,
      id: 'mock-new-user-id',
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
    
    // 保存 token 到本地存储
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }
  
  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // 清除本地存储的 token
    localStorage.removeItem('auth_token');
  }
  
  async updateUser(userData: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 150));
    this.mockUser = { ...this.mockUser, ...userData, updated_at: new Date().toISOString() };
    return { ...this.mockUser };
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
    const url = `${this.config.api_base_url}${endpoint}`;
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
    
    return response.json();
  }
  
  async me(): Promise<User> {
    return this.request<User>('/auth/me');
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // 保存 token
    localStorage.setItem('auth_token', response.token);
    
    return response;
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
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
