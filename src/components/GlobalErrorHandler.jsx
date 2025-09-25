/**
 * 全局错误处理组件
 * 提供统一的错误处理和用户反馈
 */

import React, { useEffect } from 'react';
import { telemetryService } from '@/lib/platform/telemetry.js';

// 全局错误处理 Hook
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    // 处理未捕获的 JavaScript 错误
    const handleError = (event) => {
      const error = event.error || event.reason;
      telemetryService.captureError(error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href
      });
    };

    // 处理未处理的 Promise 拒绝
    const handleUnhandledRejection = (event) => {
      telemetryService.captureError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
        reason: event.reason,
        url: window.location.href
      });
    };

    // 添加事件监听器
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};

// 全局错误边界组件
export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 发送错误到遥测服务
    telemetryService.captureError(error, {
      type: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      url: window.location.href
    });
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  应用遇到了错误
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                很抱歉，应用遇到了一个意外错误。我们已经记录了这个问题，并会尽快修复。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="text-sm font-medium text-red-800 mb-2">错误详情（开发模式）:</h4>
                <pre className="text-xs text-red-700 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                重新加载页面
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 网络错误处理 Hook
export const useNetworkErrorHandler = () => {
  useEffect(() => {
    const handleOffline = () => {
      telemetryService.trackEvent({
        name: 'network_offline',
        properties: {
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    };

    const handleOnline = () => {
      telemetryService.trackEvent({
        name: 'network_online',
        properties: {
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};

// API 错误处理工具函数
export const handleApiError = (error, context = {}) => {
  // 记录 API 错误
  telemetryService.captureError(error, {
    type: 'api_error',
    ...context
  });

  // 根据错误类型提供用户友好的消息
  if (error.status === 401) {
    return '认证失败，请重新登录';
  } else if (error.status === 403) {
    return '没有权限执行此操作';
  } else if (error.status === 404) {
    return '请求的资源不存在';
  } else if (error.status === 429) {
    return '请求过于频繁，请稍后再试';
  } else if (error.status >= 500) {
    return '服务器错误，请稍后再试';
  } else {
    return error.message || '请求失败，请稍后再试';
  }
};

// 导出默认组件
export default GlobalErrorBoundary;
