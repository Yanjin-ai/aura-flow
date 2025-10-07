/**
 * Supabase 客户端配置
 * 用于与 Supabase 数据库交互
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 调试：检查环境变量
console.log('Supabase.js 环境变量检查:', {
  url: supabaseUrl ? '存在' : '缺失',
  key: supabaseAnonKey ? '存在' : '缺失'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase.js 环境变量缺失！');
  throw new Error('Supabase 环境变量未正确配置');
}

// 如果环境变量缺失，使用硬编码值
const finalUrl = supabaseUrl || 'https://lpelllegamiqdwtgqmsy.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZWxsbGVnYW1pcWR3dGdxbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDE5MzksImV4cCI6MjA3NTA3NzkzOX0.bL1GnkZ_OLwdbr_RzKZg4bV8UKrm084QFTXxOWl0MzUM';

// 创建 Supabase 客户端
export const supabase = createClient(finalUrl, finalKey);

// 导出数据库操作函数
export const db = {
  // 用户相关操作
  users: {
    // 创建用户
    create: async (userData) => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // 根据邮箱获取用户
    getByEmail: async (email) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    // 根据 ID 获取用户
    getById: async (id) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // 更新用户
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },
  
  // 任务相关操作
  tasks: {
    // 获取用户任务
    getByUserId: async (userId, filters = {}) => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);
      
      // 应用过滤器
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }
      
      const { data, error } = await query.order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    
    // 创建任务
    create: async (taskData) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // 更新任务
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // 删除任务
    delete: async (id) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    }
  },
  
  // 洞察相关操作
  insights: {
    // 获取用户洞察
    getByUserId: async (userId, filters = {}) => {
      let query = supabase
        .from('insights')
        .select('*')
        .eq('user_id', userId);
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    // 创建洞察
    create: async (insightData) => {
      const { data, error } = await supabase
        .from('insights')
        .insert(insightData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },
  
  // 反思相关操作
  reflections: {
    // 获取用户反思
    getByUserId: async (userId) => {
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    
    // 创建反思
    create: async (reflectionData) => {
      const { data, error } = await supabase
        .from('reflections')
        .insert(reflectionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};

// 导出默认实例
export default supabase;
