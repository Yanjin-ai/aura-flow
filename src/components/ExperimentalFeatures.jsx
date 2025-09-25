/**
 * 实验功能设置组件
 * 显示和管理特性开关状态
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  useAllFeatureFlagInfo, 
  getCurrentEnvironment, 
  getCurrentUserEmail 
} from '../hooks/useFeatureFlag';
import { 
  Beaker, 
  Info, 
  CheckCircle, 
  XCircle, 
  Users, 
  Globe,
  AlertTriangle 
} from 'lucide-react';

const ExperimentalFeatures = () => {
  const allFeatureFlags = useAllFeatureFlagInfo();
  const [showDetails, setShowDetails] = useState(false);
  
  const environment = getCurrentEnvironment();
  const userEmail = getCurrentUserEmail();

  // 按状态分组特性开关
  const enabledFeatures = Object.entries(allFeatureFlags).filter(
    ([_, info]) => info?.isEnabled
  );
  const disabledFeatures = Object.entries(allFeatureFlags).filter(
    ([_, info]) => !info?.isEnabled
  );

  const getStatusBadge = (info) => {
    if (info.isEnabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">已启用</Badge>;
    }
    return <Badge variant="secondary">已禁用</Badge>;
  };

  const getEnvironmentBadge = (info) => {
    if (info.environmentEnabled) {
      return <Badge variant="outline" className="text-blue-600">环境启用</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">环境禁用</Badge>;
  };

  const getAllowListBadge = (info) => {
    if (info.inAllowList) {
      return <Badge variant="outline" className="text-purple-600">白名单用户</Badge>;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Beaker className="h-8 w-8 text-orange-600" />
          实验功能
        </h1>
        <p className="text-gray-600">
          管理新功能和实验性特性的访问权限
        </p>
      </div>

      {/* 环境信息 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-4">
            <span>当前环境: <Badge variant="outline">{environment}</Badge></span>
            <span>用户邮箱: <Badge variant="outline">{userEmail || '未登录'}</Badge></span>
          </div>
        </AlertDescription>
      </Alert>

      {/* 已启用的功能 */}
      {enabledFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              已启用的功能 ({enabledFeatures.length})
            </CardTitle>
            <CardDescription>
              当前环境中可用的实验功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {enabledFeatures.map(([flagName, info]) => (
              <div key={flagName} className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-green-800">{info.description}</h3>
                  <div className="flex gap-2">
                    {getStatusBadge(info)}
                    {getEnvironmentBadge(info)}
                    {getAllowListBadge(info)}
                  </div>
                </div>
                <p className="text-sm text-green-600 mb-2">
                  功能标识: <code className="bg-green-100 px-2 py-1 rounded">{flagName}</code>
                </p>
                {showDetails && (
                  <div className="text-xs text-green-600">
                    <p>环境启用: {info.environmentEnabled ? '是' : '否'}</p>
                    <p>白名单用户: {info.inAllowList ? '是' : '否'}</p>
                    {info.allowList.length > 0 && (
                      <p>白名单: {info.allowList.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 已禁用的功能 */}
      {disabledFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <XCircle className="h-5 w-5" />
              已禁用的功能 ({disabledFeatures.length})
            </CardTitle>
            <CardDescription>
              当前环境中不可用的功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {disabledFeatures.map(([flagName, info]) => (
              <div key={flagName} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">{info.description}</h3>
                  <div className="flex gap-2">
                    {getStatusBadge(info)}
                    {getEnvironmentBadge(info)}
                    {getAllowListBadge(info)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  功能标识: <code className="bg-gray-100 px-2 py-1 rounded">{flagName}</code>
                </p>
                {showDetails && (
                  <div className="text-xs text-gray-600">
                    <p>环境启用: {info.environmentEnabled ? '是' : '否'}</p>
                    <p>白名单用户: {info.inAllowList ? '是' : '否'}</p>
                    {info.allowList.length > 0 && (
                      <p>白名单: {info.allowList.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 控制按钮 */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '隐藏详情' : '显示详情'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          刷新状态
        </Button>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                环境级别控制
              </h4>
              <p className="text-sm text-gray-600">
                功能可以在不同环境中独立启用或禁用。Staging 环境通常用于测试新功能。
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户白名单
              </h4>
              <p className="text-sm text-gray-600">
                特定用户可以通过白名单访问功能，即使功能在环境中被禁用。
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">注意事项</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• 实验功能可能不稳定，请谨慎使用</li>
                  <li>• 功能状态会定期更新，请刷新页面查看最新状态</li>
                  <li>• 如需访问特定功能，请联系管理员添加到白名单</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperimentalFeatures;
