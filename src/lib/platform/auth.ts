/**
 * 认证服务适配层
 * 抽象化用户认证相关操作
 */

import { getAppConfig } from '../config';
import { supabase } from '../supabase-browser';

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
  
  // 使用 Supabase Auth 服务
  return new SupabaseAuthService(config);
}


/**
 * Supabase 认证服务
 */
class SupabaseAuthService implements AuthService {
  constructor(private config: any) {}
  
  async me(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('未找到用户信息');
    }
    
    // 从 Supabase Auth 用户信息转换为应用用户格式
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      has_seen_welcome_guide: user.user_metadata?.has_seen_welcome_guide || false,
      language: user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: user.user_metadata?.ai_url_extraction ?? true,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password || ''
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data.user || !data.session) {
      throw new Error('登录失败');
    }
    
    // 转换用户信息格式
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
      has_seen_welcome_guide: data.user.user_metadata?.has_seen_welcome_guide || false,
      language: data.user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: data.user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: data.user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: data.user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: data.user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: data.user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: data.user.user_metadata?.ai_url_extraction ?? true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };
    
    return {
      user,
      token: data.session.access_token,
      expires_at: new Date(data.session.expires_at! * 1000).toISOString()
    };
  }
  
  async register(userData: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          has_seen_welcome_guide: false,
          language: 'zh-CN',
          auto_rollover_enabled: true,
          auto_rollover_days: 7,
          rollover_notification_enabled: true,
          ai_daily_insights: true,
          ai_weekly_insights: true,
          ai_url_extraction: true
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data.user) {
      throw new Error('注册失败');
    }
    
    // 转换用户信息格式
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      name: userData.name,
      has_seen_welcome_guide: false,
      language: 'zh-CN',
      auto_rollover_enabled: true,
      auto_rollover_days: 7,
      rollover_notification_enabled: true,
      ai_daily_insights: true,
      ai_weekly_insights: true,
      ai_url_extraction: true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };
    
    // 如果有 session，返回认证响应
    if (data.session) {
      return {
        user,
        token: data.session.access_token,
        expires_at: new Date(data.session.expires_at! * 1000).toISOString()
      };
    }
    
    // 如果没有 session（需要邮箱验证），返回用户信息但不包含 token
    return {
      user,
      token: '',
      expires_at: new Date().toISOString()
    };
  }
  
  async updateUser(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name: userData.name,
        has_seen_welcome_guide: userData.has_seen_welcome_guide,
        language: userData.language,
        auto_rollover_enabled: userData.auto_rollover_enabled,
        auto_rollover_days: userData.auto_rollover_days,
        rollover_notification_enabled: userData.rollover_notification_enabled,
        ai_daily_insights: userData.ai_daily_insights,
        ai_weekly_insights: userData.ai_weekly_insights,
        ai_url_extraction: userData.ai_url_extraction
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data.user) {
      throw new Error('更新用户信息失败');
    }
    
    // 转换用户信息格式
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
      has_seen_welcome_guide: data.user.user_metadata?.has_seen_welcome_guide || false,
      language: data.user.user_metadata?.language || 'zh-CN',
      auto_rollover_enabled: data.user.user_metadata?.auto_rollover_enabled ?? true,
      auto_rollover_days: data.user.user_metadata?.auto_rollover_days || 7,
      rollover_notification_enabled: data.user.user_metadata?.rollover_notification_enabled ?? true,
      ai_daily_insights: data.user.user_metadata?.ai_daily_insights ?? true,
      ai_weekly_insights: data.user.user_metadata?.ai_weekly_insights ?? true,
      ai_url_extraction: data.user.user_metadata?.ai_url_extraction ?? true,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at
    };
  }
  
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }
  
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }
}

// 导出默认实例
export const authService = createAuthService();
