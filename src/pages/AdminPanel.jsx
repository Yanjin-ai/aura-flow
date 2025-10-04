/**
 * 后台管理页面
 * 仅管理员可访问，提供数据管理和系统监控功能
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Download, 
  Trash2, 
  Users, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteUserId, setDeleteUserId] = useState('');

  // 获取系统统计
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-management/stats', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('获取统计信息失败');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 导出我的数据
  const exportMyData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-management/export', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('导出数据失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-flow-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('数据导出成功');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除我的数据
  const deleteMyData = async () => {
    if (deleteConfirmation !== 'DELETE_MY_DATA') {
      setError('请输入正确的确认文本：DELETE_MY_DATA');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/data-management/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 使用 cookie 认证
        },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });
      
      if (!response.ok) {
        throw new Error('删除数据失败');
      }
      
      setSuccess('数据删除成功，即将退出登录');
      setTimeout(() => {
        // 使用 cookie 认证，无需手动清除 token
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 导出所有用户数据
  const exportAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-management/export-all', {
        headers: {
          // 使用 cookie 认证
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('导出所有数据失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-flow-all-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('所有数据导出成功');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除指定用户数据
  const deleteUserData = async () => {
    if (deleteConfirmation !== 'DELETE_USER_DATA') {
      setError('请输入正确的确认文本：DELETE_USER_DATA');
      return;
    }
    
    if (!deleteUserId.trim()) {
      setError('请输入用户ID');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/data-management/delete-user/${deleteUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 使用 cookie 认证
        },
        body: JSON.stringify({ confirmation: deleteConfirmation })
      });
      
      if (!response.ok) {
        throw new Error('删除用户数据失败');
      }
      
      setSuccess('用户数据删除成功');
      setDeleteUserId('');
      setDeleteConfirmation('');
      fetchStats(); // 刷新统计
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">后台管理</h1>
        <p className="text-gray-600">系统管理和数据操作面板</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="data-management">数据管理</TabsTrigger>
          <TabsTrigger value="user-management">用户管理</TabsTrigger>
          <TabsTrigger value="system">系统监控</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  最近30天新增: {stats?.recentUsers || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  有活跃会话的用户
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总任务数</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  所有用户创建的任务
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总洞察数</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalInsights || 0}</div>
                <p className="text-xs text-muted-foreground">
                  AI 生成的洞察
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总反思数</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalReflections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  用户反思记录
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统状态</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  正常运行
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  所有服务正常
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 数据管理标签页 */}
        <TabsContent value="data-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>个人数据管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={exportMyData} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  导出我的数据
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Label className="text-red-600 font-medium">危险操作</Label>
                <p className="text-sm text-gray-600 mb-4">
                  删除所有个人数据，此操作不可撤销
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="输入 DELETE_MY_DATA 确认删除"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    onClick={deleteMyData}
                    disabled={loading || deleteConfirmation !== 'DELETE_MY_DATA'}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除我的所有数据
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>管理员数据操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={exportAllData} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  导出所有用户数据
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Label className="text-red-600 font-medium">删除用户数据</Label>
                <p className="text-sm text-gray-600 mb-4">
                  删除指定用户的所有数据，此操作不可撤销
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="输入用户ID"
                    value={deleteUserId}
                    onChange={(e) => setDeleteUserId(e.target.value)}
                  />
                  <Input
                    placeholder="输入 DELETE_USER_DATA 确认删除"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    onClick={deleteUserData}
                    disabled={loading || deleteConfirmation !== 'DELETE_USER_DATA' || !deleteUserId.trim()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除用户数据
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户管理标签页 */}
        <TabsContent value="user-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">用户管理功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统监控标签页 */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统监控</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">系统监控功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
