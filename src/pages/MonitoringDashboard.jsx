/**
 * 监控仪表板页面
 * 显示系统健康状态、性能指标和告警信息
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  Cpu,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Zap,
  HardDrive,
  
} from 'lucide-react';

const MonitoringDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 新增状态
  const [errorTop5, setErrorTop5] = useState([]);
  const [aiCostData, setAiCostData] = useState({
    daily: { used: 0, limit: 3.0, percentage: 0 },
    monthly: { used: 0, limit: 30.0, percentage: 0 }
  });
  const [circuitBreakerEvents, setCircuitBreakerEvents] = useState([]);

  // 获取系统概览
  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/monitoring/overview', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('获取系统概览失败');
      }
      
      const data = await response.json();
      setOverview(data.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    }
  };

  // 获取健康状态
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/health');
      
      if (!response.ok) {
        throw new Error('获取健康状态失败');
      }
      
      const data = await response.json();
      setHealthStatus(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  // 获取告警
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('获取告警失败');
      }
      
      const data = await response.json();
      setAlerts(data.data.alerts);
    } catch (err) {
      setError(err.message);
    }
  };

  // 获取性能指标
  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/performance', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('获取性能指标失败');
      }
      
      const data = await response.json();
      setMetrics(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  // 获取错误 Top5
  const fetchErrorTop5 = async () => {
    try {
      const response = await fetch('/api/monitoring/errors/top5');
      
      if (!response.ok) {
        throw new Error('获取错误统计失败');
      }
      
      const data = await response.json();
      setErrorTop5(data.data || []);
    } catch (err) {
      console.error('获取错误统计失败:', err);
    }
  };

  // 获取 AI 成本数据
  const fetchAiCostData = async () => {
    try {
      const response = await fetch('/api/monitoring/ai/cost');
      
      if (!response.ok) {
        throw new Error('获取 AI 成本数据失败');
      }
      
      const data = await response.json();
      setAiCostData(data.data || {
        daily: { used: 0, limit: 3.0, percentage: 0 },
        monthly: { used: 0, limit: 30.0, percentage: 0 }
      });
    } catch (err) {
      console.error('获取 AI 成本数据失败:', err);
    }
  };

  // 获取熔断器事件
  const fetchCircuitBreakerEvents = async () => {
    try {
      const response = await fetch('/api/monitoring/ai/circuit-breaker-events');
      
      if (!response.ok) {
        throw new Error('获取熔断器事件失败');
      }
      
      const data = await response.json();
      setCircuitBreakerEvents(data.data || []);
    } catch (err) {
      console.error('获取熔断器事件失败:', err);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchHealthStatus(),
        fetchAlerts(),
        fetchPerformanceMetrics(),
        fetchErrorTop5(),
        fetchAiCostData(),
        fetchCircuitBreakerEvents()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发健康检查
  const triggerHealthCheck = async (checkName) => {
    try {
      const response = await fetch(`/api/monitoring/health-check/${checkName}`, {
        method: 'POST',
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('触发健康检查失败');
      }
      
      // 刷新数据
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 清除告警
  const clearAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'DELETE',
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('清除告警失败');
      }
      
      setAlerts([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refreshData();
    
    // 设置自动刷新
    const interval = setInterval(refreshData, 30000); // 30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const formatMemory = (bytes) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载监控数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">系统监控</h1>
          <p className="text-gray-600">实时监控系统健康状态和性能指标</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {lastUpdate && (
        <div className="mb-4 text-sm text-gray-500">
          最后更新: {lastUpdate.toLocaleString()}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="health">健康检查</TabsTrigger>
          <TabsTrigger value="alerts">告警</TabsTrigger>
          <TabsTrigger value="ai-monitoring">AI 监控</TabsTrigger>
          <TabsTrigger value="metrics">指标</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统状态</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthStatus?.overall)}
                  <span className="text-2xl font-bold capitalize">
                    {healthStatus?.overall || 'unknown'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  整体系统状态
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">运行时间</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.uptime ? formatUptime(overview.uptime) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  系统运行时间
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">内存使用</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.memory ? formatMemory(overview.memory.heapUsed) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  堆内存使用量
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃告警</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {alerts.filter(alert => alert.severity === 'critical').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  严重告警数量
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 健康检查标签页 */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>健康检查状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthStatus?.checks && Object.entries(healthStatus.checks).map(([key, check]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h3 className="font-medium">{check.name}</h3>
                        <p className="text-sm text-gray-500">
                          最后检查: {new Date(check.lastCheck).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                        {check.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerHealthCheck(key)}
                      >
                        检查
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 告警标签页 */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>系统告警</CardTitle>
              {alerts.length > 0 && (
                <Button variant="outline" onClick={clearAlerts}>
                  清除告警
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无告警
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium">{alert.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 成本与稳定性标签页 */}
        <TabsContent value="ai-monitoring" className="space-y-6">
          {/* 错误 Top5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                错误 Top5（按路由/状态）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorTop5.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无错误数据
                </div>
              ) : (
                <div className="space-y-3">
                  {errorTop5.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{error.route}</h4>
                          <p className="text-sm text-gray-500">状态: {error.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-600">{error.count}</div>
                        <div className="text-sm text-gray-500">次错误</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI 成本燃尽 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                AI 成本燃尽（本日/本月）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 每日成本 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">每日成本</h4>
                  <span className="text-sm text-gray-500">
                    ${aiCostData.daily.used.toFixed(2)} / ${aiCostData.daily.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(aiCostData.daily.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  使用率: {aiCostData.daily.percentage.toFixed(1)}%
                </div>
              </div>

              {/* 每月成本 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">每月成本</h4>
                  <span className="text-sm text-gray-500">
                    ${aiCostData.monthly.used.toFixed(2)} / ${aiCostData.monthly.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(aiCostData.monthly.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  使用率: {aiCostData.monthly.percentage.toFixed(1)}%
                </div>
              </div>

              {/* 成本趋势 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">今日节省</span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ${(aiCostData.daily.limit - aiCostData.daily.used).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">本月剩余</span>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    ${(aiCostData.monthly.limit - aiCostData.monthly.used).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 熔断/降级事件时间线 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                最近 30 分钟熔断/降级事件时间线
              </CardTitle>
            </CardHeader>
            <CardContent>
              {circuitBreakerEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无熔断/降级事件
                </div>
              ) : (
                <div className="space-y-3">
                  {circuitBreakerEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        event.type === 'circuit_open' ? 'bg-red-500' :
                        event.type === 'circuit_close' ? 'bg-green-500' :
                        event.type === 'degraded' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {event.type === 'circuit_open' ? '熔断器开启' :
                             event.type === 'circuit_close' ? '熔断器关闭' :
                             event.type === 'degraded' ? '服务降级' : '未知事件'}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          路由: {event.route} | 原因: {event.reason}
                        </p>
                        {event.duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            持续时间: {event.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 指标标签页 */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>系统指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>内存使用</span>
                    <span className="font-mono">
                      {metrics.memory?.length > 0 
                        ? formatMemory(metrics.memory[metrics.memory.length - 1]?.value || 0)
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU 使用</span>
                    <span className="font-mono">
                      {metrics.cpu?.length > 0 
                        ? `${(metrics.cpu[metrics.cpu.length - 1]?.value || 0).toFixed(2)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>运行时间</span>
                    <span className="font-mono">
                      {metrics.uptime?.length > 0 
                        ? formatUptime(metrics.uptime[metrics.uptime.length - 1]?.value || 0)
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>健康检查指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.healthChecks && Object.entries(metrics.healthChecks).map(([key, check]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}</span>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {check.duration?.length > 0 
                            ? `${check.duration[check.duration.length - 1]?.value || 0}ms`
                            : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {check.status?.length > 0 
                            ? (check.status[check.status.length - 1]?.value === 1 ? '健康' : '异常')
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
