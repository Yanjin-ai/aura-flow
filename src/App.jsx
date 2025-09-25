import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GlobalErrorBoundary, useGlobalErrorHandler, useNetworkErrorHandler } from "@/components/GlobalErrorHandler.jsx"
import CookieConsent from "@/components/CookieConsent.jsx"
import { AuthProvider } from "@/contexts/AuthContext"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 对于 4xx 错误不重试
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // 最多重试 3 次
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
})

// 应用内容组件
function AppContent() {
  // 初始化全局错误处理
  useGlobalErrorHandler();
  useNetworkErrorHandler();

  return (
    <>
      <Pages />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <CookieConsent />
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  )
}

export default App 