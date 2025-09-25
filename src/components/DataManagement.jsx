/**
 * 数据管理组件
 * 提供数据导出、删除等 GDPR 合规功能
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2, AlertTriangle, Shield, FileText } from 'lucide-react';

const DataManagement = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // 导出用户数据
  const handleExportData = async () => {
    setIsExporting(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/data-management/export-my-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-flow-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('数据导出成功！文件已下载到您的设备。');
      setMessageType('success');
    } catch (error) {
      console.error('导出数据失败:', error);
      setMessage('数据导出失败，请稍后重试。');
      setMessageType('error');
    } finally {
      setIsExporting(false);
    }
  };

  // 删除用户数据
  const handleDeleteData = async () => {
    if (deleteConfirmation !== 'DELETE_MY_DATA') {
      setMessage('请输入正确的确认文本：DELETE_MY_DATA');
      setMessageType('error');
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch('/api/data-management/delete-my-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation
        })
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      setMessage('您的数据已成功删除。您将被重定向到登录页面。');
      setMessageType('success');

      // 清除本地存储并重定向
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, 3000);

    } catch (error) {
      console.error('删除数据失败:', error);
      setMessage('数据删除失败，请稍后重试。');
      setMessageType('error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">数据管理</h1>
        <p className="text-gray-600">管理您的个人数据，符合 GDPR 和其他隐私法规</p>
      </div>

      {message && (
        <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={messageType === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 数据导出 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              导出我的数据
            </CardTitle>
            <CardDescription>
              下载您的所有个人数据，包括任务、洞察、反思等
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">数据包含：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>个人资料信息</li>
                  <li>所有任务和项目</li>
                  <li>AI 生成的洞察</li>
                  <li>反思记录</li>
                  <li>反馈和评分</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? '导出中...' : '导出数据'}
            </Button>
          </CardContent>
        </Card>

        {/* 数据删除 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              删除我的数据
            </CardTitle>
            <CardDescription>
              永久删除您的账户和所有相关数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>警告：</strong>此操作不可撤销！删除后您将无法恢复任何数据。
              </AlertDescription>
            </Alert>

            {!showDeleteConfirm ? (
              <Button 
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full"
              >
                删除我的数据
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="confirmation">
                    请输入 <code className="bg-gray-100 px-2 py-1 rounded">DELETE_MY_DATA</code> 确认删除
                  </Label>
                  <Input
                    id="confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE_MY_DATA"
                    className="mt-2"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDeleteData}
                    disabled={isDeleting || deleteConfirmation !== 'DELETE_MY_DATA'}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isDeleting ? '删除中...' : '确认删除'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 隐私政策信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            隐私政策
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 mb-4">
              我们重视您的隐私权，并致力于保护您的个人数据。根据 GDPR 和其他隐私法规，
              您有权：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>访问您的个人数据</li>
              <li>更正不准确的数据</li>
              <li>删除您的数据（"被遗忘权"）</li>
              <li>限制数据处理</li>
              <li>数据可移植性</li>
              <li>反对数据处理</li>
            </ul>
            <p className="text-gray-600 mt-4">
              如果您有任何隐私相关问题，请联系我们的隐私团队：
              <a href="mailto:privacy@auraflow.com" className="text-blue-600 hover:underline ml-1">
                privacy@auraflow.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;
