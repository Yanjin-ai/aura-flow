import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import ErrorBoundary from '@/components/dev/ErrorBoundary.jsx'
import StartupBanner from '@/components/dev/StartupBanner.jsx'
import '@/index.css'

// MSW 开关：在开发环境且未显式关闭时开启
async function startMSW() {
  if (import.meta.env.DEV && (import.meta.env.VITE_DEV_MOCK ?? 'on') !== 'off') {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

// 环境变量校验
const requiredEnvVars = {
  VITE_APP_ID: import.meta.env.VITE_APP_ID || 'aura-flow-dev'
};

// 检查必需的环境变量
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

// 启动 MSW（不阻塞应用启动）
startMSW().catch(console.error);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  console.error('请创建 .env.local 文件并设置以下变量:');
  missingVars.forEach(key => {
    console.error(`  ${key}=your_value_here`);
  });
  console.error('参考 .env.example 文件获取更多信息');
  
  // 显示轻量占位，不阻止应用启动
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <StartupBanner />
        <div style={{padding:16}}>缺少 AppId（开发占位），请设置 .env.local</div>
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  // 环境变量检查通过，正常启动应用
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <StartupBanner />
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} 