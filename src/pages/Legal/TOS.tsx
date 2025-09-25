/**
 * 服务条款页面
 * 明确用户权利和义务
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Scale
} from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          服务条款
        </h1>
        <p className="text-gray-600">
          使用 Aura Flow 服务前，请仔细阅读以下条款
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Badge variant="outline">用户协议</Badge>
          <Badge variant="outline">服务条款</Badge>
          <Badge variant="outline">法律约束</Badge>
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

      {/* 服务描述 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            服务描述
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Aura Flow 是一个智能任务管理和洞察生成平台，提供以下服务：
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">核心功能</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 任务创建和管理</li>
                <li>• AI 驱动的洞察生成</li>
                <li>• 数据分析和报告</li>
                <li>• 团队协作工具</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">高级功能</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 智能任务分类</li>
                <li>• 个性化推荐</li>
                <li>• 数据导出</li>
                <li>• API 访问</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户责任 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            用户责任和义务
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              允许的行为
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
              <li>合法使用服务进行个人或商业目的</li>
              <li>提供真实、准确的个人信息</li>
              <li>保护您的账户安全</li>
              <li>遵守所有适用的法律法规</li>
              <li>尊重其他用户的权利</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              禁止的行为
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
              <li>上传或分享非法、有害或不当内容</li>
              <li>尝试破解、逆向工程或干扰服务</li>
              <li>创建虚假账户或冒充他人</li>
              <li>发送垃圾邮件或恶意软件</li>
              <li>侵犯他人知识产权</li>
              <li>进行任何形式的欺诈活动</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 服务可用性 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            服务可用性和限制
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">服务可用性</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 我们努力保持 99.9% 的服务可用性</li>
                <li>• 定期维护可能影响服务</li>
                <li>• 不可抗力因素可能导致服务中断</li>
                <li>• 我们会提前通知计划维护</li>
              </ul>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">使用限制</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 免费用户有使用量限制</li>
                <li>• API 调用频率限制</li>
                <li>• 存储空间限制</li>
                <li>• 并发用户数限制</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 知识产权 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-600" />
            知识产权
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">我们的权利</h4>
            <p className="text-sm text-gray-600 mb-2">
              Aura Flow 平台、软件、商标、版权和其他知识产权归我们所有。
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">您的权利</h4>
            <p className="text-sm text-gray-600 mb-2">
              您保留对您上传内容的所有权利。通过使用我们的服务，您授予我们必要的许可来提供这些服务。
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">使用许可</h4>
            <p className="text-sm text-purple-700">
              我们授予您有限的、非独占的、不可转让的许可来使用我们的服务，
              仅用于您自己的个人或商业目的。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 隐私和数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            隐私和数据保护
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            我们重视您的隐私，并按照我们的隐私政策处理您的个人信息。
            我们采用行业标准的安全措施来保护您的数据。
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">数据安全</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 加密传输和存储</li>
                <li>• 定期安全审计</li>
                <li>• 访问权限控制</li>
                <li>• 数据备份和恢复</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">您的权利</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 访问您的数据</li>
                <li>• 更正不准确信息</li>
                <li>• 删除您的数据</li>
                <li>• 导出数据副本</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 服务变更和终止 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            服务变更和终止
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">服务变更</h4>
            <p className="text-sm text-gray-600">
              我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">账户终止</h4>
            <p className="text-sm text-gray-600">
              您可以随时删除您的账户。我们可能因违反服务条款而终止您的账户。
            </p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">终止后果</h4>
            <p className="text-sm text-red-700">
              账户终止后，您将无法访问您的数据。我们将在合理时间内保留您的数据，
              以便您导出或恢复。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 免责声明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            免责声明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">服务按现状提供</h4>
            <p className="text-sm text-orange-700">
              我们的服务按"现状"提供，不提供任何明示或暗示的保证。
              我们不保证服务的连续性、准确性或完整性。
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">责任限制</h4>
            <p className="text-sm text-gray-600">
              在法律允许的最大范围内，我们对因使用或无法使用服务而产生的
              任何直接、间接、偶然或后果性损害不承担责任。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 适用法律 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-gray-600" />
            适用法律和争议解决
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">适用法律</h4>
            <p className="text-sm text-gray-600">
              本服务条款受中华人民共和国法律管辖，不考虑法律冲突原则。
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">争议解决</h4>
            <p className="text-sm text-gray-600">
              因本服务条款产生的任何争议，双方应首先通过友好协商解决。
              协商不成的，可向有管辖权的人民法院提起诉讼。
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
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">一般咨询</h4>
                <p className="text-sm text-gray-600">
                  <a href="mailto:support@yourdomain.com" className="text-blue-600 hover:underline">
                    support@yourdomain.com
                  </a>
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">法律事务</h4>
                <p className="text-sm text-gray-600">
                  <a href="mailto:legal@yourdomain.com" className="text-blue-600 hover:underline">
                    legal@yourdomain.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
