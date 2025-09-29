/**
 * 统一的 API 客户端
 * 使用平台适配层提供完整的 API 接口
 */

import { authService, databaseService, aiService, storageService, telemetryService } from './platform/index.ts';
import { getPlatformConfig } from './platform/config.ts';

// 初始化遥测服务
telemetryService.init().catch(console.error);

/**
 * 统一的 API 客户端接口
 * 提供完整的 API 接口，使用平台适配层
 */
export const apiClient = {
  // 认证相关
  auth: {
    // 获取当前用户信息
    me: () => authService.me(),
    
    // 用户登录
    login: (credentials) => authService.login(credentials),
    
    // 用户登出
    logout: () => authService.logout(),
    
    // 更新用户信息
    updateMyUserData: (userData) => authService.updateUser(userData),
    
    // 检查认证状态
    isAuthenticated: () => authService.isAuthenticated()
  },
  
  // 实体操作
  entities: {
    // 任务操作
    Task: {
      filter: (filters = {}) => databaseService.tasks.filter(filters),
      create: (data) => databaseService.tasks.create(data),
      update: (id, data) => databaseService.tasks.update(id, data),
      delete: (id) => databaseService.tasks.delete(id),
      getById: (id) => databaseService.tasks.getById(id)
    },
    
    // 洞察操作
    Insight: {
      filter: (filters = {}) => databaseService.insights.filter(filters),
      create: (data) => databaseService.insights.create(data),
      getById: (id) => databaseService.insights.getById(id)
    },
    
    // 反思操作
    Reflection: {
      filter: (filters = {}) => databaseService.reflections.filter(filters),
      create: (data) => databaseService.reflections.create(data),
      getById: (id) => databaseService.reflections.getById(id)
    },
    
    // 洞察反馈操作
    InsightFeedback: {
      create: (data) => databaseService.insightFeedback.create(data)
    }
  },
  
  // 集成服务
  integrations: {
    Core: {
      // AI 服务调用
      InvokeLLM: async (params) => {
        try {
          const result = await aiService.generateText({
            prompt: params.prompt || '',
            max_tokens: params.max_tokens,
            temperature: params.temperature,
            context: params.context
          });
          
          // 记录 AI 调用
          telemetryService.trackEvent({
            name: 'ai_invoke',
            properties: {
              provider: getPlatformConfig().ai_provider,
              model: getPlatformConfig().ai_model,
              tokens_used: result.metadata?.tokens_used
            }
          });
          
          return result;
        } catch (error) {
          telemetryService.captureError(error, { context: 'ai_invoke' });
          throw error;
        }
      },
      
      // 邮件发送（模拟实现）
      SendEmail: async (params) => {
        telemetryService.trackEvent({
          name: 'email_send',
          properties: {
            to: params.to,
            subject: params.subject
          }
        });
        
        // 模拟邮件发送
        return { success: true, message_id: `mock-${Date.now()}` };
      },
      
      // 文件上传
      UploadFile: async (file, options = {}) => {
        try {
          const result = await storageService.uploadFile(file, options);
          
          telemetryService.trackEvent({
            name: 'file_upload',
            properties: {
              filename: result.filename,
              size: result.size,
              mime_type: result.mime_type
            }
          });
          
          return result;
        } catch (error) {
          telemetryService.captureError(error, { context: 'file_upload' });
          throw error;
        }
      },
      
      // 图片生成（模拟实现）
      GenerateImage: async (params) => {
        telemetryService.trackEvent({
          name: 'image_generate',
          properties: {
            prompt: params.prompt,
            style: params.style
          }
        });
        
        // 模拟图片生成
        return {
          url: `https://mock-images.example.com/generated-${Date.now()}.jpg`,
          file_id: `img-${Date.now()}`
        };
      },
      
      // 从上传文件提取数据
      ExtractDataFromUploadedFile: async (fileId, extractionType) => {
        try {
          const result = await storageService.extractDataFromFile(fileId, extractionType);
          
          telemetryService.trackEvent({
            name: 'data_extraction',
            properties: {
              file_id: fileId,
              extraction_type: extractionType
            }
          });
          
          return result;
        } catch (error) {
          telemetryService.captureError(error, { context: 'data_extraction' });
          throw error;
        }
      },
      
      // 创建签名 URL
      CreateFileSignedUrl: async (fileId, method = 'GET') => {
        try {
          const result = await storageService.createSignedUrl(fileId, method);
          
          telemetryService.trackEvent({
            name: 'signed_url_create',
            properties: {
              file_id: fileId,
              method: method
            }
          });
          
          return result;
        } catch (error) {
          telemetryService.captureError(error, { context: 'signed_url_create' });
          throw error;
        }
      },
      
      // 上传私有文件
      UploadPrivateFile: async (file, options = {}) => {
        try {
          const result = await storageService.uploadPrivateFile(file, options);
          
          telemetryService.trackEvent({
            name: 'private_file_upload',
            properties: {
              filename: result.filename,
              size: result.size,
              mime_type: result.mime_type
            }
          });
          
          return result;
        } catch (error) {
          telemetryService.captureError(error, { context: 'private_file_upload' });
          throw error;
        }
      }
    }
  }
};

// 导出 API 客户端

// 导出默认实例
export default apiClient;
