/**
 * 遥测和监控服务适配层
 * 统一错误追踪、性能监控和用户行为分析
 */

import { getPlatformConfig } from './config';
import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  user_id?: string;
  session_id?: string;
}

export interface ErrorEvent extends TelemetryEvent {
  name: 'error';
  properties: {
    message: string;
    stack?: string;
    component?: string;
    url?: string;
    user_agent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface PerformanceEvent extends TelemetryEvent {
  name: 'performance';
  properties: {
    metric: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    component?: string;
  };
}

export interface UserActionEvent extends TelemetryEvent {
  name: 'user_action';
  properties: {
    action: string;
    target?: string;
    context?: string;
    value?: any;
  };
}

/**
 * 遥测服务接口
 */
export interface TelemetryService {
  // 初始化服务
  init(): Promise<void>;
  
  // 捕获错误
  captureError(error: Error, context?: Record<string, any>): void;
  
  // 记录性能指标
  recordPerformance(metric: string, value: number, unit?: 'ms' | 'bytes' | 'count'): void;
  
  // 记录用户行为
  trackUserAction(action: string, properties?: Record<string, any>): void;
  
  // 记录自定义事件
  trackEvent(event: TelemetryEvent): void;
  
  // 设置用户上下文
  setUserContext(user_id: string, properties?: Record<string, any>): void;
  
  // 设置会话上下文
  setSessionContext(session_id: string, properties?: Record<string, any>): void;
}

/**
 * 创建遥测服务实例
 */
export function createTelemetryService(): TelemetryService {
  const config = getPlatformConfig();
  
  // 如果遥测被禁用，直接返回无操作服务
  if (!config.enable_telemetry) {
    return new NoOpTelemetryService();
  }
  
  // 如果配置了 Sentry DSN，尝试使用 Sentry 服务
  if (config.sentry_dsn && config.sentry_dsn.trim() !== '') {
    return new SentryTelemetryService(config);
  }
  
  // 否则使用控制台服务
  return new ConsoleTelemetryService(config);
}

/**
 * 无操作遥测服务（遥测关闭时使用）
 */
class NoOpTelemetryService implements TelemetryService {
  async init(): Promise<void> {
    // 无操作
  }
  
  captureError(error: Error, context?: Record<string, any>): void {
    // 无操作
  }
  
  recordPerformance(metric: string, value: number, unit?: 'ms' | 'bytes' | 'count'): void {
    // 无操作
  }
  
  trackUserAction(action: string, properties?: Record<string, any>): void {
    // 无操作
  }
  
  trackEvent(event: TelemetryEvent): void {
    // 无操作
  }
  
  setUserContext(user_id: string, properties?: Record<string, any>): void {
    // 无操作
  }
  
  setSessionContext(session_id: string, properties?: Record<string, any>): void {
    // 无操作
  }
}

/**
 * 控制台遥测服务（开发环境使用）
 */
class ConsoleTelemetryService implements TelemetryService {
  private userContext: Record<string, any> = {};
  private sessionContext: Record<string, any> = {};
  
  constructor(private config: any) {}
  
  async init(): Promise<void> {
    console.log('遥测服务已初始化（控制台模式）');
  }
  
  captureError(error: Error, context?: Record<string, any>): void {
    console.error('错误捕获:', {
      message: error.message,
      stack: error.stack,
      context,
      user_context: this.userContext,
      session_context: this.sessionContext,
      timestamp: new Date().toISOString()
    });
  }
  
  recordPerformance(metric: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms'): void {
    console.log('性能指标:', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }
  
  trackUserAction(action: string, properties?: Record<string, any>): void {
    console.log('用户行为:', {
      action,
      properties,
      user_context: this.userContext,
      session_context: this.sessionContext,
      timestamp: new Date().toISOString()
    });
  }
  
  trackEvent(event: TelemetryEvent): void {
    console.log('自定义事件:', {
      ...event,
      user_context: this.userContext,
      session_context: this.sessionContext,
      timestamp: event.timestamp || new Date().toISOString()
    });
  }
  
  setUserContext(user_id: string, properties?: Record<string, any>): void {
    this.userContext = { user_id, ...properties };
  }
  
  setSessionContext(session_id: string, properties?: Record<string, any>): void {
    this.sessionContext = { session_id, ...properties };
  }
}

/**
 * Sentry 遥测服务（生产环境使用）
 * 支持动态导入 @sentry/browser 包
 * 如果没有配置 DSN 或导入失败，会自动回退到控制台模式
 */
class SentryTelemetryService implements TelemetryService {
  private sentry: any = null;
  private userContext: Record<string, any> = {};
  private sessionContext: Record<string, any> = {};
  
  constructor(private config: any) {}
  
  async init(): Promise<void> {
    try {
      // 检查是否配置了 Sentry DSN
      if (!this.config.sentry_dsn || this.config.sentry_dsn.trim() === '') {
        console.log('Sentry DSN 未配置，使用控制台模式');
        const consoleService = new ConsoleTelemetryService(this.config);
        Object.assign(this, consoleService);
        return;
      }

      // 动态导入 Sentry
      const Sentry = await import('@sentry/browser');
      
      Sentry.init({
        dsn: this.config.sentry_dsn,
        environment: this.config.environment,
        release: this.config.build_version,
        integrations: [
          new Sentry.BrowserTracing({
            // 配置路由跟踪
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigationType,
              createRoutesFromChildren,
              matchRoutes
            ),
          }),
          new Sentry.Replay({
            // 会话重放配置
            maskAllText: false,
            blockAllMedia: false,
          })
        ],
        // 性能监控采样率
        tracesSampleRate: this.config.environment === 'production' ? 0.1 : 1.0,
        // 会话重放采样率
        replaysSessionSampleRate: this.config.environment === 'production' ? 0.1 : 0.5,
        // 错误重放采样率
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event) {
          // 过滤掉开发环境的错误
          if (process.env.NODE_ENV === 'development') {
            return null;
          }
          
          // 过滤掉一些不重要的错误
          if (event.exception) {
            const error = event.exception.values?.[0];
            if (error?.type === 'ChunkLoadError' || 
                error?.type === 'Loading chunk failed' ||
                error?.value?.includes('Loading chunk')) {
              return null;
            }
          }
          
          return event;
        },
        beforeSendTransaction(event) {
          // 过滤掉一些不重要的性能事件
          if (event.transaction === 'pageload' && event.tags?.url?.includes('localhost')) {
            return null;
          }
          return event;
        }
      });
      
      this.sentry = Sentry;
      console.log('Sentry 遥测服务已初始化');
    } catch (error) {
      console.warn('Sentry 初始化失败，回退到控制台模式:', error);
      const consoleService = new ConsoleTelemetryService(this.config);
      Object.assign(this, consoleService);
    }
  }
  
  captureError(error: Error, context?: Record<string, any>): void {
    if (this.sentry) {
      this.sentry.captureException(error, {
        contexts: {
          custom: context,
          user: this.userContext,
          session: this.sessionContext
        }
      });
    } else {
      console.error('错误捕获:', error, context);
    }
  }
  
  recordPerformance(metric: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms'): void {
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric}: ${value}${unit}`,
        level: 'info',
        data: { metric, value, unit }
      });
    } else {
      console.log('性能指标:', { metric, value, unit });
    }
  }
  
  trackUserAction(action: string, properties?: Record<string, any>): void {
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        category: 'user',
        message: action,
        level: 'info',
        data: properties
      });
    } else {
      console.log('用户行为:', { action, properties });
    }
  }
  
  trackEvent(event: TelemetryEvent): void {
    if (this.sentry) {
      this.sentry.addBreadcrumb({
        category: 'custom',
        message: event.name,
        level: 'info',
        data: event.properties
      });
    } else {
      console.log('自定义事件:', event);
    }
  }
  
  setUserContext(user_id: string, properties?: Record<string, any>): void {
    this.userContext = { user_id, ...properties };
    
    if (this.sentry) {
      this.sentry.setUser({ id: user_id, ...properties });
    }
  }
  
  setSessionContext(session_id: string, properties?: Record<string, any>): void {
    this.sessionContext = { session_id, ...properties };
    
    if (this.sentry) {
      this.sentry.setContext('session', { id: session_id, ...properties });
    }
  }
}

// 导出默认实例
export const telemetryService = createTelemetryService();
