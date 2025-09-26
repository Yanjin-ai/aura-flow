/**
 * 数据库服务适配层
 * 抽象化数据实体操作
 */

import { getPlatformConfig } from './config';

// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
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
  const config = getPlatformConfig();
  
  // 根据配置选择实现方式
  // 只要选择了 mock 提供商，则无论环境直接使用 MockDatabaseService，避免误连真实后端
  if (config.ai_provider === 'mock') {
    return new MockDatabaseService();
  }
  
  return new ApiDatabaseService(config);
}

/**
 * Mock 数据库服务（开发环境使用）
 */
class MockDatabaseService implements DatabaseService {
  private tasksData: Task[] = [];
  private insightsData: Insight[] = [];
  private reflectionsData: Reflection[] = [];
  private feedback: InsightFeedback[] = [];
  
  tasks = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.tasksData.filter(task => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.user_id && task.user_id !== filters.user_id) return false;
        return true;
      });
    },
    
    create: async (data: CreateTaskData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const task: Task = {
        id: `task-${Date.now()}`,
        title: data.title,
        description: data.description,
        status: 'pending',
        priority: data.priority || 'medium',
        due_date: data.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'mock-user-id',
        tags: data.tags,
        metadata: data.metadata
      };
      this.tasksData.push(task);
      return task;
    },
    
    update: async (id: string, data: UpdateTaskData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const index = this.tasksData.findIndex(task => task.id === id);
      if (index === -1) throw new Error('任务不存在');
      
      this.tasksData[index] = {
        ...this.tasksData[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      return this.tasksData[index];
    },
    
    delete: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const index = this.tasksData.findIndex(task => task.id === id);
      if (index === -1) return false;
      
      this.tasksData.splice(index, 1);
      return true;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.tasksData.find(task => task.id === id) || null;
    }
  };
  
  insights = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.insightsData.filter(insight => {
        if (filters.type && insight.type !== filters.type) return false;
        if (filters.user_id && insight.user_id !== filters.user_id) return false;
        return true;
      });
    },
    
    create: async (data: CreateInsightData) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const insight: Insight = {
        id: `insight-${Date.now()}`,
        title: data.title,
        content: data.content,
        type: data.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'mock-user-id',
        metadata: data.metadata
      };
      this.insightsData.push(insight);
      return insight;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.insightsData.find(insight => insight.id === id) || null;
    }
  };
  
  reflections = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.reflectionsData.filter(reflection => {
        if (filters.user_id && reflection.user_id !== filters.user_id) return false;
        return true;
      });
    },
    
    create: async (data: CreateReflectionData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const reflection: Reflection = {
        id: `reflection-${Date.now()}`,
        content: data.content,
        mood: data.mood,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'mock-user-id',
        metadata: data.metadata
      };
      this.reflectionsData.push(reflection);
      return reflection;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.reflectionsData.find(reflection => reflection.id === id) || null;
    }
  };
  
  insightFeedback = {
    create: async (data: CreateInsightFeedbackData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const feedback: InsightFeedback = {
        id: `feedback-${Date.now()}`,
        insight_id: data.insight_id,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date().toISOString(),
        user_id: 'mock-user-id'
      };
      this.feedback.push(feedback);
      return feedback;
    }
  };
}

/**
 * API 数据库服务（生产环境使用）
 */
class ApiDatabaseService implements DatabaseService {
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
  
  tasks = {
    filter: async (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      return this.request<Task[]>(`/tasks?${params.toString()}`);
    },
    
    create: async (data: CreateTaskData) => {
      return this.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    update: async (id: string, data: UpdateTaskData) => {
      return this.request<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    
    delete: async (id: string) => {
      await this.request(`/tasks/${id}`, { method: 'DELETE' });
      return true;
    },
    
    getById: async (id: string) => {
      return this.request<Task | null>(`/tasks/${id}`);
    }
  };
  
  insights = {
    filter: async (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
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
    filter: async (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
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
