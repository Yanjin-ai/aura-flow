/**
 * 数据库服务适配层
 * 抽象化数据实体操作
 */

import { getPlatformConfig } from './config';

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
  const config = getPlatformConfig();
  
  // 在生产环境中强制使用 API 服务进行调试
  if (config.environment === 'production') {
    console.log('使用 ApiDatabaseService (生产环境)');
    return new ApiDatabaseService(config);
  }
  
  // 开发环境使用 Mock 服务
  console.log('使用 MockDatabaseService (开发环境)');
  return new MockDatabaseService();
}

/**
 * Mock 数据库服务（开发环境使用）
 */
class MockDatabaseService implements DatabaseService {
  private getTasksData(): Task[] {
    const stored = localStorage.getItem('mock_tasks_data');
    return stored ? JSON.parse(stored) : [];
  }
  
  private setTasksData(tasks: Task[]): void {
    localStorage.setItem('mock_tasks_data', JSON.stringify(tasks));
  }
  
  private getInsightsData(): Insight[] {
    const stored = localStorage.getItem('mock_insights_data');
    return stored ? JSON.parse(stored) : [];
  }
  
  private setInsightsData(insights: Insight[]): void {
    localStorage.setItem('mock_insights_data', JSON.stringify(insights));
  }
  
  private getReflectionsData(): Reflection[] {
    const stored = localStorage.getItem('mock_reflections_data');
    return stored ? JSON.parse(stored) : [];
  }
  
  private setReflectionsData(reflections: Reflection[]): void {
    localStorage.setItem('mock_reflections_data', JSON.stringify(reflections));
  }
  
  private getFeedbackData(): InsightFeedback[] {
    const stored = localStorage.getItem('mock_feedback_data');
    return stored ? JSON.parse(stored) : [];
  }
  
  private setFeedbackData(feedback: InsightFeedback[]): void {
    localStorage.setItem('mock_feedback_data', JSON.stringify(feedback));
  }
  
  tasks = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const tasksData = this.getTasksData();
      return tasksData.filter(task => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.user_id && task.user_id !== filters.user_id) return false;
        if (filters.date && task.date !== filters.date) return false;
        return true;
      });
    },
    
    create: async (data: CreateTaskData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const tasksData = this.getTasksData();
      const task: Task = {
        id: `task-${Date.now()}`,
        title: data.title,
        content: data.content,
        description: data.description,
        status: 'pending',
        priority: data.priority || 'medium',
        due_date: data.due_date,
        date: data.date,
        order_index: data.order_index || 0,
        completed: data.completed || false,
        ai_category: data.ai_category,
        due_time: data.due_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'mock-user-id',
        tags: data.tags,
        metadata: data.metadata
      };
      tasksData.push(task);
      this.setTasksData(tasksData);
      return task;
    },
    
    update: async (id: string, data: UpdateTaskData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const tasksData = this.getTasksData();
      const index = tasksData.findIndex(task => task.id === id);
      if (index === -1) throw new Error('任务不存在');
      
      tasksData[index] = {
        ...tasksData[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      this.setTasksData(tasksData);
      return tasksData[index];
    },
    
    delete: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const tasksData = this.getTasksData();
      const index = tasksData.findIndex(task => task.id === id);
      if (index === -1) return false;
      
      tasksData.splice(index, 1);
      this.setTasksData(tasksData);
      return true;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const tasksData = this.getTasksData();
      return tasksData.find(task => task.id === id) || null;
    }
  };
  
  insights = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const insightsData = this.getInsightsData();
      return insightsData.filter(insight => {
        if (filters.type && insight.type !== filters.type) return false;
        if (filters.user_id && insight.user_id !== filters.user_id) return false;
        return true;
      });
    },
    
    create: async (data: CreateInsightData) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const insightsData = this.getInsightsData();
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
      insightsData.push(insight);
      this.setInsightsData(insightsData);
      return insight;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const insightsData = this.getInsightsData();
      return insightsData.find(insight => insight.id === id) || null;
    }
  };
  
  reflections = {
    filter: async (filters = {}) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const reflectionsData = this.getReflectionsData();
      return reflectionsData.filter(reflection => {
        if (filters.user_id && reflection.user_id !== filters.user_id) return false;
        return true;
      });
    },
    
    create: async (data: CreateReflectionData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const reflectionsData = this.getReflectionsData();
      const reflection: Reflection = {
        id: `reflection-${Date.now()}`,
        content: data.content,
        mood: data.mood,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'mock-user-id',
        metadata: data.metadata
      };
      reflectionsData.push(reflection);
      this.setReflectionsData(reflectionsData);
      return reflection;
    },
    
    getById: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const reflectionsData = this.getReflectionsData();
      return reflectionsData.find(reflection => reflection.id === id) || null;
    }
  };
  
  insightFeedback = {
    create: async (data: CreateInsightFeedbackData) => {
      await new Promise(resolve => setTimeout(resolve, 150));
      const feedbackData = this.getFeedbackData();
      const feedback: InsightFeedback = {
        id: `feedback-${Date.now()}`,
        insight_id: data.insight_id,
        rating: data.rating,
        comment: data.comment,
        created_at: new Date().toISOString(),
        user_id: 'mock-user-id'
      };
      feedbackData.push(feedback);
      this.setFeedbackData(feedbackData);
      return feedback;
    }
  };
}

/**
 * API 数据库服务（生产环境使用）- 调试版本
 */
class ApiDatabaseService implements DatabaseService {
  private baseUrl: string;
  
  constructor(private config: any) {
    // 在生产环境中，强制使用相对路径调用我们的 Vercel API
    if (config.environment === 'production') {
      this.baseUrl = ''; // 使用相对路径
    } else {
      this.baseUrl = config.api_base_url || '';
    }
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async getCurrentUserId(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('未找到认证令牌');
    }
    
    try {
      const tokenData = JSON.parse(atob(token));
      return tokenData.user_id;
    } catch (error) {
      throw new Error('无效的认证令牌');
    }
  }
  
  tasks = {
    filter: async (filters = {}) => {
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
      const endpoint = `/tasks-debug${queryString ? '?' + queryString : ''}`;
      
      return this.request<Task[]>(endpoint);
    },
    
    create: async (data: CreateTaskData) => {
      const userId = await this.getCurrentUserId();
      
      return this.request<Task>('/tasks-debug', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          user_id: userId
        })
      });
    },
    
    update: async (id: string, data: UpdateTaskData) => {
      return this.request<Task>(`/tasks-debug?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    
    delete: async (id: string) => {
      return this.request<void>(`/tasks-debug?id=${id}`, {
        method: 'DELETE'
      });
    },
    
    getById: async (id: string) => {
      const tasks = await this.request<Task[]>('/tasks-debug');
      return tasks.find(task => task.id === id) || null;
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
