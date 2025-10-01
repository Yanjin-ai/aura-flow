import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/lib/platform/auth';

// 创建认证上下文
const AuthContext = createContext();

// 认证上下文 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化时检查用户认证状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      // 直接调用 me() API 检查认证状态，使用 cookie 认证
      try {
        const userData = await authService.me();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('认证状态检查失败:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 用户登录
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 用户注册
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('AuthContext: 注册失败:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 用户登出
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, error: error.message };
    }
  };

  // 更新用户信息
  const updateUser = async (userData) => {
    try {
      const updatedUser = await authService.updateUser(userData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
