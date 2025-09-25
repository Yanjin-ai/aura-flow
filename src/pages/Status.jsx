/**
 * 系统状态页面
 * 显示系统信息、构建信息、后端健康状态等
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Server, 
  Database, 
  Brain, 
  Clock, 
  GitBranch, 
  Hash,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

const Status = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 获取系统信息
  const getSystemInfo = () => {
    return {
      gitSha: import.meta.env.VITE_BUILD_VERSION || 'unknown',
      buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
      environment: import.meta.env.MODE || 'development',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'unknown',
      aiProvider: import.meta.env.VITE_AI_PROVIDER || 'unknown',
      enableTelemetry: import.meta.env.VITE_ENABLE_TELEMETRY || 'false',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  };

  // 获取后端健康状态
  const fetchBackendHealth = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // 并行获取多个健康检查端点
      const [healthz, readyz, detailed] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/healthz`).then(res => res.json()),
        fetch(`${apiBaseUrl}/readyz`).then(res => res.json()),
        fetch(`${apiBaseUrl}/health/detailed`).then(res => res.json())
      ]);

      return {
        healthz: healthz.status === 'fulfilled' ? healthz.value : null,
        readyz: readyz.status === 'fulfilled' ? readyz.value : null,
        detailed: detailed.status === 'fulfilled' ? detailed.value : null,
        errors: {
          healthz: healthz.status === 'rejected' ? healthz.reason.message : null,
          readyz: readyz.status === 'rejected' ? readyz.reason.message : null,
          detailed: detailed.status === 'rejected' ? detailed.reason.message : null
        }
      };
    } catch (error) {
      return {
        healthz: null,
        readyz: null,
        detailed: null,
        errors: {
          general: error.message
        }
      };
    }
  };

  // 刷新数据
  const refreshData = async () => {
    setLoading(true);
    try {
      const [system, backend] = await Promise.all([
        Promise.resolve(getSystemInfo()),
        fetchBackendHealth()
      ]);
      
      setSystemInfo(system);
      setBackendHealth(backend);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    refreshData();
    
    // 每30秒自动刷新
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
      case 'not_ready':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'unknown':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'unhealthy':
      case 'not_ready':
        return 'bg-red-100 text-red-800';
      case 'unknown':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !systemInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">加载系统状态...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            系统状态
          </h1>
          <p className="text-gray-600">
            实时监控系统健康状态和运行信息
          </p>
        </div>
        <Button onClick={refreshData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 系统信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Git SHA:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {systemInfo?.gitSha || 'unknown'}
                </code>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">构建时间:</span>
                <span className="text-sm text-gray-600">
                  {systemInfo?.buildTime || 'unknown'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">环境:</span>
                <Badge variant="outline">{systemInfo?.environment || 'unknown'}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">API 地址:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {systemInfo?.apiBaseUrl || 'unknown'}
                </code>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">AI 提供商:</span>
                <Badge variant="outline">{systemInfo?.aiProvider || 'unknown'}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">遥测:</span>
                <Badge variant={systemInfo?.enableTelemetry === 'true' ? 'default' : 'secondary'}>
                  {systemInfo?.enableTelemetry === 'true' ? '启用' : '禁用'}
                </Badge>
              </div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              最后更新: {new Date(lastUpdate).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 后端健康状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            后端健康状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 存活检查 */}
          {backendHealth?.healthz && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">存活检查 (healthz)</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(backendHealth.healthz.status)}
                  <Badge className={getStatusColor(backendHealth.healthz.status)}>
                    {backendHealth.healthz.status}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>运行时间: {Math.floor(backendHealth.healthz.uptime || 0)} 秒</p>
                <p>内存使用: {Math.round((backendHealth.healthz.memory?.rss || 0) / 1024 / 1024)} MB</p>
              </div>
            </div>
          )}

          {/* 就绪检查 */}
          {backendHealth?.readyz && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">就绪检查 (readyz)</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(backendHealth.readyz.status)}
                  <Badge className={getStatusColor(backendHealth.readyz.status)}>
                    {backendHealth.readyz.status}
                  </Badge>
                </div>
              </div>
              
              {backendHealth.readyz.checks && (
                <div className="space-y-2 mt-2">
                  {Object.entries(backendHealth.readyz.checks).map(([key, check]) => {
                    if (key === 'overall') return null;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          <span className="text-gray-600">
                            {check.duration ? `${check.duration}ms` : check.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {backendHealth?.errors && Object.values(backendHealth.errors).some(error => error) && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">错误信息</h4>
              {Object.entries(backendHealth.errors).map(([key, error]) => {
                if (!error) return null;
                return (
                  <div key={key} className="text-sm text-red-700">
                    <strong>{key}:</strong> {error}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详细健康信息 */}
      {backendHealth?.detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              详细健康信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">系统资源</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>CPU 使用: {Math.round(backendHealth.detailed.cpu?.user || 0)} μs</p>
                  <p>内存使用: {Math.round((backendHealth.detailed.memory?.rss || 0) / 1024 / 1024)} MB</p>
                  <p>平台: {backendHealth.detailed.platform}</p>
                  <p>Node 版本: {backendHealth.detailed.node_version}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">依赖服务</h4>
                <div className="space-y-1 text-sm">
                  {backendHealth.detailed.dependencies && Object.entries(backendHealth.detailed.dependencies).map(([key, dep]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dep.status)}
                        <span className="text-gray-600">
                          {dep.duration ? `${dep.duration}ms` : dep.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Status;
