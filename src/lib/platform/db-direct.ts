/**
 * 直接数据库服务 - 绕过 Vercel API，直接使用 Supabase
 * 这是为了解决 API 函数环境变量问题的临时方案
 */

import { supabase } from '../supabase-browser'

export class DirectDatabaseService {
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error('用户未登录')
    }
    return user.id
  }

  async getTasks(userId?: string, date?: string, completed?: boolean) {
    try {
      const currentUserId = userId || await this.getCurrentUserId()
      
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })

      if (date) {
        query = query.eq('date', date)
      }
      
      if (completed !== undefined) {
        query = query.eq('completed', completed)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('获取任务失败:', error)
        throw new Error('获取任务失败')
      }

      return data || []
    } catch (error) {
      console.error('数据库操作失败:', error)
      throw error
    }
  }

  async createTask(taskData: any) {
    try {
      const userId = await this.getCurrentUserId()
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('创建任务失败:', error)
        throw new Error('创建任务失败')
      }

      return data
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  }

  async updateTask(taskId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        console.error('更新任务失败:', error)
        throw new Error('更新任务失败')
      }

      return data
    } catch (error) {
      console.error('更新任务失败:', error)
      throw error
    }
  }

  async deleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('删除任务失败:', error)
        throw new Error('删除任务失败')
      }

      return true
    } catch (error) {
      console.error('删除任务失败:', error)
      throw error
    }
  }
}

// 导出单例
export const directDb = new DirectDatabaseService()
