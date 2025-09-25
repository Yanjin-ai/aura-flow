/**
 * 隐私政策页面
 * 符合 GDPR 和隐私保护要求
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Eye, 
  Database, 
  Lock, 
  User, 
  Mail, 
  Calendar,
  FileText,
  Settings
} from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          隐私政策
        </h1>
        <p className="text-gray-600">
          我们重视您的隐私，本政策说明了我们如何收集、使用和保护您的个人信息
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="outline">GDPR 合规</Badge>
          <Badge variant="outline">数据保护</Badge>
          <Badge variant="outline">透明处理</Badge>
        </div>
      </div>

      {/* 最后更新时间 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>最后更新时间：2024年1月1日</span>
          </div>
        </CardContent>
      </Card>

      {/* 信息收集 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            我们收集的信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">个人信息</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>邮箱地址（用于账户创建和登录）</li>
              <li>姓名（可选，用于个性化体验）</li>
              <li>语言偏好设置</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">使用数据</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>任务和项目数据（您创建的内容）</li>
              <li>AI 洞察生成记录（匿名化处理）</li>
              <li>应用使用统计（匿名化处理）</li>
              <li>错误日志（不包含个人信息）</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">技术信息</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>IP 地址（匿名化处理）</li>
              <li>浏览器类型和版本</li>
              <li>设备信息（匿名化处理）</li>
              <li>访问时间和页面浏览记录</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 信息使用 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            信息使用目的
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">服务提供</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 提供任务管理功能</li>
                <li>• 生成 AI 洞察</li>
                <li>• 个性化用户体验</li>
                <li>• 账户管理</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">服务改进</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 分析使用模式</li>
                <li>• 优化 AI 算法</li>
                <li>• 修复错误和问题</li>
                <li>• 开发新功能</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据保护 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            数据保护措施
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Lock className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h4 className="font-medium text-red-800">加密传输</h4>
              <p className="text-sm text-red-700">所有数据传输使用 HTTPS 加密</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Database className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-orange-800">安全存储</h4>
              <p className="text-sm text-orange-700">数据加密存储在安全服务器上</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-800">访问控制</h4>
              <p className="text-sm text-purple-700">严格的访问权限管理</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 您的权利 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            您的权利
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">数据访问权</h4>
              <p className="text-sm text-gray-600">您可以随时查看我们持有的关于您的个人信息</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">数据更正权</h4>
              <p className="text-sm text-gray-600">您可以要求更正不准确的个人信息</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">数据删除权</h4>
              <p className="text-sm text-gray-600">您可以要求删除您的个人信息</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">数据导出权</h4>
              <p className="text-sm text-gray-600">您可以导出您的数据副本</p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">如何行使您的权利</h4>
            <p className="text-sm text-blue-700">
              您可以通过设置页面的"数据管理"功能或发送邮件至 
              <a href="mailto:privacy@yourdomain.com" className="underline">privacy@yourdomain.com</a> 
              来行使这些权利。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cookie 政策 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-600" />
            Cookie 和跟踪技术
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">我们使用的 Cookie</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>必要 Cookie：</strong>用于基本网站功能，如登录状态</li>
              <li><strong>分析 Cookie：</strong>用于了解网站使用情况（匿名化）</li>
              <li><strong>偏好 Cookie：</strong>用于记住您的设置和偏好</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Cookie 管理</h4>
            <p className="text-sm text-yellow-700">
              您可以通过浏览器设置管理 Cookie，或在首次访问时选择接受或拒绝非必要 Cookie。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 联系我们 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-600" />
            联系我们
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">邮箱联系</h4>
                <p className="text-sm text-gray-600">
                  <a href="mailto:privacy@yourdomain.com" className="text-blue-600 hover:underline">
                    privacy@yourdomain.com
                  </a>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">数据保护官</h4>
                <p className="text-sm text-gray-600">
                  <a href="mailto:dpo@yourdomain.com" className="text-blue-600 hover:underline">
                    dpo@yourdomain.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 政策更新 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            政策更新
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            我们可能会不时更新本隐私政策。重大变更将通过邮件或应用内通知告知您。
            建议您定期查看本页面以了解最新信息。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
