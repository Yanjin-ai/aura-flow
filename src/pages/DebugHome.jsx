import React, { useState, useEffect } from "react";
import { getPlatformConfig } from "@/lib/platform/config";

export default function DebugHome() {
  const [config, setConfig] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [buildInfo, setBuildInfo] = useState(null);

  useEffect(() => {
    // 获取平台配置
    try {
      const platformConfig = getPlatformConfig();
      setConfig(platformConfig);
    } catch (error) {
      console.error('获取平台配置失败:', error);
    }

    // 获取构建信息
    setBuildInfo({
      version: import.meta.env.VITE_BUILD_VERSION || 'dev',
      mode: import.meta.env.MODE || 'development',
      timestamp: new Date().toISOString()
    });

    // 检查 API 健康状态
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiHealth({ status: 'healthy', data });
      } else {
        setApiHealth({ status: 'unhealthy', error: response.statusText });
      }
    } catch (error) {
      setApiHealth({ status: 'error', error: error.message });
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h1 className="text-3xl font-bold mb-6">🚀 Aura Flow 调试中心</h1>
      
      {/* 构建信息 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">📦 构建信息</h2>
        {buildInfo && (
          <div className="space-y-2">
            <p><strong>版本:</strong> {buildInfo.version}</p>
            <p><strong>环境:</strong> {buildInfo.mode}</p>
            <p><strong>时间戳:</strong> {buildInfo.timestamp}</p>
          </div>
        )}
      </div>

      {/* 平台配置 */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">⚙️ 平台配置</h2>
        {config ? (
          <div className="space-y-2">
            <p><strong>API 地址:</strong> {config.api_base_url}</p>
            <p><strong>AI 提供方:</strong> {config.ai_provider}</p>
            <p><strong>遥测状态:</strong> {config.enable_telemetry ? '启用' : '禁用'}</p>
            <p><strong>环境:</strong> {config.environment}</p>
          </div>
        ) : (
          <p className="text-red-600">配置加载失败</p>
        )}
      </div>

      {/* API 健康状态 */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">🏥 API 健康状态</h2>
        {apiHealth ? (
          <div className="space-y-2">
            <p><strong>状态:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                apiHealth.status === 'healthy' ? 'bg-green-200 text-green-800' :
                apiHealth.status === 'unhealthy' ? 'bg-yellow-200 text-yellow-800' :
                'bg-red-200 text-red-800'
              }`}>
                {apiHealth.status === 'healthy' ? '健康' : 
                 apiHealth.status === 'unhealthy' ? '不健康' : '错误'}
              </span>
            </p>
            {apiHealth.data && (
              <div className="mt-2">
                <p><strong>运行时间:</strong> {Math.floor(apiHealth.data.uptime)} 秒</p>
                <p><strong>版本:</strong> {apiHealth.data.version}</p>
              </div>
            )}
            {apiHealth.error && (
              <p className="text-red-600"><strong>错误:</strong> {apiHealth.error}</p>
            )}
            <button 
              onClick={checkApiHealth}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新检查
            </button>
          </div>
        ) : (
          <p>检查中...</p>
        )}
      </div>

      {/* 快速导航 */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">🧭 快速导航</h2>
        <div className="grid grid-cols-2 gap-2">
          <a href="/Home" className="p-2 bg-white rounded border hover:bg-gray-50">首页</a>
          <a href="/DayView" className="p-2 bg-white rounded border hover:bg-gray-50">日程视图</a>
          <a href="/Insights" className="p-2 bg-white rounded border hover:bg-gray-50">洞察</a>
          <a href="/Analytics" className="p-2 bg-white rounded border hover:bg-gray-50">分析</a>
          <a href="/Settings" className="p-2 bg-white rounded border hover:bg-gray-50">设置</a>
          <a href="/ReflectionHistory" className="p-2 bg-white rounded border hover:bg-gray-50">反思历史</a>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">📊 系统状态</h2>
        <div className="space-y-2">
          <p><strong>用户代理:</strong> {navigator.userAgent}</p>
          <p><strong>屏幕分辨率:</strong> {window.screen.width}x{window.screen.height}</p>
          <p><strong>视口大小:</strong> {window.innerWidth}x{window.innerHeight}</p>
          <p><strong>在线状态:</strong> {navigator.onLine ? '在线' : '离线'}</p>
        </div>
      </div>
    </div>
  );
}

// 调试入口页面，提供系统状态监控和快速导航功能

