/**
 * 存储服务适配层
 * 抽象化文件存储和上传操作
 */

import { getPlatformConfig } from './config';

export interface FileUploadResult {
  url: string;
  file_id: string;
  filename: string;
  size: number;
  mime_type: string;
  metadata?: Record<string, any>;
}

export interface FileUploadOptions {
  filename?: string;
  mime_type?: string;
  metadata?: Record<string, any>;
  is_private?: boolean;
}

export interface SignedUrlResult {
  url: string;
  expires_at: string;
  method: 'GET' | 'POST' | 'PUT';
}

/**
 * 存储服务接口
 */
export interface StorageService {
  // 上传文件
  uploadFile(file: File, options?: FileUploadOptions): Promise<FileUploadResult>;
  
  // 上传私有文件
  uploadPrivateFile(file: File, options?: FileUploadOptions): Promise<FileUploadResult>;
  
  // 创建签名 URL
  createSignedUrl(file_id: string, method?: 'GET' | 'POST' | 'PUT'): Promise<SignedUrlResult>;
  
  // 从上传文件提取数据
  extractDataFromFile(file_id: string, extraction_type?: string): Promise<any>;
}

/**
 * 创建存储服务实例
 */
export function createStorageService(): StorageService {
  const config = getPlatformConfig();
  
  // 根据配置选择实现方式
  if (config.environment === 'development' && config.ai_provider === 'mock') {
    return new MockStorageService();
  }
  
  return new ApiStorageService(config);
}

/**
 * Mock 存储服务（开发环境使用）
 */
class MockStorageService implements StorageService {
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      url: `https://mock-storage.example.com/files/${Date.now()}-${file.name}`,
      file_id: `file-${Date.now()}`,
      filename: options.filename || file.name,
      size: file.size,
      mime_type: options.mime_type || file.type,
      metadata: options.metadata
    };
  }
  
  async uploadPrivateFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      url: `https://mock-storage.example.com/private/${Date.now()}-${file.name}`,
      file_id: `private-file-${Date.now()}`,
      filename: options.filename || file.name,
      size: file.size,
      mime_type: options.mime_type || file.type,
      metadata: { ...options.metadata, is_private: true }
    };
  }
  
  async createSignedUrl(file_id: string, method: 'GET' | 'POST' | 'PUT' = 'GET'): Promise<SignedUrlResult> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      url: `https://mock-storage.example.com/signed/${file_id}?token=mock-token`,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1小时后过期
      method
    };
  }
  
  async extractDataFromFile(file_id: string, extraction_type?: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      extracted_data: `从文件 ${file_id} 提取的模拟数据`,
      extraction_type: extraction_type || 'text',
      confidence: 0.95,
      metadata: {
        file_id,
        processed_at: new Date().toISOString()
      }
    };
  }
}

/**
 * API 存储服务（生产环境使用）
 */
class ApiStorageService implements StorageService {
  constructor(private config: any) {}
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.api_base_url}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers
      },
      credentials: 'include' // 使用 cookie 认证
    });
    
    if (!response.ok) {
      throw new Error(`存储 API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.filename) formData.append('filename', options.filename);
    if (options.mime_type) formData.append('mime_type', options.mime_type);
    if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
    
    return this.request<FileUploadResult>('/storage/upload', {
      method: 'POST',
      body: formData
    });
  }
  
  async uploadPrivateFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_private', 'true');
    
    if (options.filename) formData.append('filename', options.filename);
    if (options.mime_type) formData.append('mime_type', options.mime_type);
    if (options.metadata) formData.append('metadata', JSON.stringify(options.metadata));
    
    return this.request<FileUploadResult>('/storage/upload-private', {
      method: 'POST',
      body: formData
    });
  }
  
  async createSignedUrl(file_id: string, method: 'GET' | 'POST' | 'PUT' = 'GET'): Promise<SignedUrlResult> {
    return this.request<SignedUrlResult>('/storage/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id, method })
    });
  }
  
  async extractDataFromFile(file_id: string, extraction_type?: string): Promise<any> {
    return this.request('/storage/extract-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id, extraction_type })
    });
  }
}

// 导出默认实例
export const storageService = createStorageService();
