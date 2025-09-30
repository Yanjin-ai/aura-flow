/**
 * 统一配置管理
 * 集中管理所有环境变量和配置
 */

export interface AppConfig {
  // 环境配置
  environment: 'development' | 'production';
  
  // API 配置
  apiBaseUrl: string;
  apiTimeout: number;
  
  // 认证配置
  auth: {
    useApiService: boolean;
    debugMode: boolean;
  };
  
  // 数据库配置
  database: {
    useApiService: boolean;
    debugMode: boolean;
  };
  
  // AI 配置
  ai: {
    provider: 'openai' | 'qwen' | 'minimax' | 'mock';
    apiKey?: string;
    model?: string;
  };
  
  // 监控配置
  monitoring: {
    sentryDsn?: string;
    enableTelemetry: boolean;
  };
  
  // 构建信息
  build: {
    version: string;
  };
}

/**
 * 获取应用配置
 */
export function getAppConfig(): AppConfig {
  const isProduction = import.meta.env.MODE === 'production';
  
  return {
    environment: isProduction ? 'production' : 'development',
    
    // API 配置 - 生产环境使用相对路径
    apiBaseUrl: isProduction ? '' : 'http://localhost:3001',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    
    // 认证配置 - 统一使用 API 服务
    auth: {
      useApiService: true,
      debugMode: isProduction // 生产环境使用调试模式
    },
    
    // 数据库配置 - 统一使用 API 服务
    database: {
      useApiService: true,
      debugMode: isProduction // 生产环境使用调试模式
    },
    
    // AI 配置
    ai: {
      provider: (import.meta.env.VITE_AI_PROVIDER as any) || 'mock',
      apiKey: import.meta.env.VITE_AI_API_KEY,
      model: import.meta.env.VITE_AI_MODEL || 'gpt-3.5-turbo'
    },
    
    // 监控配置
    monitoring: {
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      enableTelemetry: import.meta.env.VITE_ENABLE_TELEMETRY === 'true'
    },
    
    // 构建信息
    build: {
      version: import.meta.env.VITE_BUILD_VERSION || 'dev'
    }
  };
}

/**
 * 验证配置
 */
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];
  
  if (!config.apiBaseUrl && config.environment === 'development') {
    errors.push('开发环境需要设置 API base URL');
  }
  
  if (config.ai.provider !== 'mock' && !config.ai.apiKey) {
    errors.push(`${config.ai.provider} 需要设置 API Key`);
  }
  
  return errors;
}
