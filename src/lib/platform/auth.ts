/**
 * 认证服务适配层
 * 抽象化用户认证相关操作
 */

import { getAppConfig } from '../config';

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
  const config = getAppConfig();
  
  // 统一使用 API 服务
  return new ApiAuthService(config);
}


/**
 * API 认证服务（生产环境使用）
 */
class ApiAuthService implements AuthService {
  private baseUrl: string;
  private debugMode: boolean;
  
  constructor(private config: any) {
    this.baseUrl = config.apiBaseUrl || '';
    this.debugMode = config.auth.debugMode || false;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 使用相对路径，指向 Vercel API 路由
    // 暂时把 /auth/me 切到 /auth/me-v2 以规避旧函数缓存
    const fixedEndpoint = endpoint === '/auth/me' ? '/auth/me-v2' : endpoint;
    const url = `/api${fixedEndpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include' // 使用 cookie 认证
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
    const result = await this.request<any>('/auth/me');
    
    // API 返回 { success: true, user: ... }
    if (result && typeof result === 'object' && 'success' in result && 'user' in result) {
      return result.user;
    }
    
    return result;
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const result = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // 认证 API 返回 { success: true, user: ..., token: ... }
    const response = result && typeof result === 'object' && 'success' in result && 'user' in result
      ? {
          user: result.user,
          token: result.token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      : result;
    
    // 使用 cookie 认证，无需手动保存 token
    
    return response;
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const result = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // 认证 API 返回 { success: true, user: ..., token: ... }
    const response = result && typeof result === 'object' && 'success' in result && 'user' in result
      ? {
          user: result.user,
          token: result.token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      : result;
    
    // 使用 cookie 认证，无需手动保存 token
    
    return response;
  }
  
  async updateUser(userData: Partial<User>): Promise<User> {
    const result = await this.request<any>('/auth/update', {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
    
    // API 返回 { success: true, user: ... }
    if (result && typeof result === 'object' && 'success' in result && 'user' in result) {
      return result.user;
    }
    
    return result;
  }
  
  async logout(): Promise<void> {
    // 使用 cookie 认证，无需手动清除 token
    // 后端会清除 cookie
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
