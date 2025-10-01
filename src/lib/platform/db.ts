/**
 * 数据库服务适配层
 * 抽象化数据实体操作
 */

import { getAppConfig } from '../config';

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  content?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  date?: string;
  order_index?: number;
  completed?: boolean;
  ai_category?: string;
  due_time?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateTaskData {
  title: string;
  content?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  date?: string;
  order_index?: number;
  completed?: boolean;
  ai_category?: string;
  due_time?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTaskData {
  title?: string;
  content?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  date?: string;
  order_index?: number;
  completed?: boolean;
  ai_category?: string;
  due_time?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 洞察相关类型
export interface Insight {
  id: string;
  title: string;
  content: string;
  type: 'daily' | 'weekly' | 'custom';
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, any>;
}

export interface CreateInsightData {
  title: string;
  content: string;
  type: 'daily' | 'weekly' | 'custom';
  metadata?: Record<string, any>;
}

// 反思相关类型
export interface Reflection {
  id: string;
  content: string;
  mood?: 'positive' | 'neutral' | 'negative';
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, any>;
}

export interface CreateReflectionData {
  content: string;
  mood?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

// 反馈相关类型
export interface InsightFeedback {
  id: string;
  insight_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  user_id: string;
}

export interface CreateInsightFeedbackData {
  insight_id: string;
  rating: number;
  comment?: string;
}

/**
 * 数据库服务接口
 */
export interface DatabaseService {
  // 任务操作
  tasks: {
    filter(filters?: { status?: string; priority?: string; user_id?: string }): Promise<Task[]>;
    create(data: CreateTaskData): Promise<Task>;
    update(id: string, data: UpdateTaskData): Promise<Task>;
    delete(id: string): Promise<boolean>;
    getById(id: string): Promise<Task | null>;
  };
  
  // 洞察操作
  insights: {
    filter(filters?: { type?: string; user_id?: string }): Promise<Insight[]>;
    create(data: CreateInsightData): Promise<Insight>;
    getById(id: string): Promise<Insight | null>;
  };
  
  // 反思操作
  reflections: {
    filter(filters?: { user_id?: string }): Promise<Reflection[]>;
    create(data: CreateReflectionData): Promise<Reflection>;
    getById(id: string): Promise<Reflection | null>;
  };
  
  // 反馈操作
  insightFeedback: {
    create(data: CreateInsightFeedbackData): Promise<InsightFeedback>;
  };
}

/**
 * 创建数据库服务实例
 */
export function createDatabaseService(): DatabaseService {
  const config = getAppConfig();
  
  // 统一使用 API 服务
  return new ApiDatabaseService(config);
}


/**
 * API 数据库服务（生产环境使用）- 调试版本
 */
class ApiDatabaseService implements DatabaseService {
  private baseUrl: string;
  private debugMode: boolean;
  
  constructor(private config: any) {
    this.baseUrl = config.apiBaseUrl || '';
    this.debugMode = config.database.debugMode || false;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include' // 使用 cookie 认证
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async getCurrentUserId(): Promise<string> {
    // 通过 me() API 获取当前用户 ID，使用 cookie 认证
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('未找到认证令牌');
      }
      
      const result = await response.json();
      if (result && result.user && result.user.id) {
        return result.user.id;
      }
      
      throw new Error('无效的用户数据');
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  }
  
  tasks = {
    filter: async (filters: any = {}) => {
      const userId = await this.getCurrentUserId();
      
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('user_id', userId);
      
      if (filters.date) {
        params.append('date', filters.date);
      }
      
      if (filters.completed !== undefined) {
        params.append('completed', filters.completed.toString());
      }
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      
      const queryString = params.toString();
      const endpoint = `/tasks${queryString ? '?' + queryString : ''}`;
      
      return this.request<Task[]>(endpoint);
    },
    
    create: async (data: CreateTaskData) => {
      const userId = await this.getCurrentUserId();
      
      return this.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          user_id: userId
        })
      });
    },
    
    update: async (id: string, data: UpdateTaskData) => {
      return this.request<Task>(`/tasks?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    
    delete: async (id: string) => {
      await this.request<void>(`/tasks?id=${id}`, {
        method: 'DELETE'
      });
      return true;
    },
    
    getById: async (id: string) => {
      const tasks = await this.request<Task[]>('/tasks');
      return tasks.find(task => task.id === id) || null;
    }
  };
  
  insights = {
    filter: async (filters: any = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      
      return this.request<Insight[]>(`/insights?${params.toString()}`);
    },
    
    create: async (data: CreateInsightData) => {
      return this.request<Insight>('/insights', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    getById: async (id: string) => {
      return this.request<Insight | null>(`/insights/${id}`);
    }
  };
  
  reflections = {
    filter: async (filters: any = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      
      return this.request<Reflection[]>(`/reflections?${params.toString()}`);
    },
    
    create: async (data: CreateReflectionData) => {
      return this.request<Reflection>('/reflections', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    getById: async (id: string) => {
      return this.request<Reflection | null>(`/reflections/${id}`);
    }
  };
  
  insightFeedback = {
    create: async (data: CreateInsightFeedbackData) => {
      return this.request<InsightFeedback>('/insight-feedback', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };
}

// 导出默认实例
export const databaseService = createDatabaseService();
