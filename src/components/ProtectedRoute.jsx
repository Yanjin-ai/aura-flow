import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 受保护的路由组件
 * 需要用户登录才能访问的页面
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已登录，渲染子组件
  return children;
}

/**
 * 公开路由组件
 * 只有未登录用户才能访问的页面（如登录、注册页面）
 */
export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果已登录，重定向到主页
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/DayView';
    return <Navigate to={from} replace />;
  }

  // 如果未登录，渲染子组件
  return children;
}
