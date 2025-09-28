/**
 * 平台配置管理
 * 统一管理环境变量和平台配置
 */

export interface PlatformConfig {
  // API 配置
  api_base_url: string;
  api_timeout: number;
  
  // AI 配置
  ai_provider: 'openai' | 'qwen' | 'minimax' | 'mock';
  ai_api_key?: string;
  ai_model?: string;
  
  // 监控配置
  sentry_dsn?: string;
  enable_telemetry: boolean;
  
  // 构建信息
  build_version: string;
  environment: 'development' | 'staging' | 'production';
}

/**
 * 从环境变量获取平台配置
 */
export function getPlatformConfig(): PlatformConfig {
  const config: PlatformConfig = {
    // API 配置
    api_base_url: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    api_timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    
    // AI 配置
    ai_provider: (import.meta.env.VITE_AI_PROVIDER as PlatformConfig['ai_provider']) || 'mock',
    ai_api_key: import.meta.env.VITE_AI_API_KEY,
    ai_model: import.meta.env.VITE_AI_MODEL || 'gpt-3.5-turbo',
    
    // 监控配置
    sentry_dsn: import.meta.env.VITE_SENTRY_DSN,
    enable_telemetry: import.meta.env.VITE_ENABLE_TELEMETRY === 'true',
    
    // 构建信息
    build_version: import.meta.env.VITE_BUILD_VERSION || 'dev',
    environment: (import.meta.env.MODE as PlatformConfig['environment']) || 'development'
  };
  
  // 在生产环境中使用真实 API
  if (import.meta.env.MODE === 'production') {
    config.environment = 'production';
    config.ai_provider = 'mock'; // 暂时使用 mock AI
  }
  
  return config;
}

/**
 * 验证配置完整性
 */
export function validateConfig(config: PlatformConfig): string[] {
  const errors: string[] = [];
  
  if (!config.api_base_url) {
    errors.push('VITE_API_BASE_URL 未设置');
  }
  
  if (config.ai_provider !== 'mock' && !config.ai_api_key) {
    errors.push(`${config.ai_provider} 需要设置 VITE_AI_API_KEY`);
  }
  
  return errors;
}
