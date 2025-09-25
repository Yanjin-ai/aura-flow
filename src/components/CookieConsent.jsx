/**
 * Cookie 同意组件
 * 符合 GDPR 要求，记录用户选择到 localStorage
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Cookie, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Shield,
  BarChart3,
  Target
} from 'lucide-react';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,    // 必要 Cookie（不可关闭）
    analytics: false,   // 分析 Cookie
    preferences: false, // 偏好 Cookie
    marketing: false    // 营销 Cookie
  });

  // 检查是否已有 Cookie 同意记录
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // 加载已保存的偏好
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.warn('无法解析 Cookie 偏好设置:', error);
      }
    }
  }, []);

  // 保存偏好设置
  const savePreferences = (newPreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(newPreferences));
    localStorage.setItem('cookie_consent_timestamp', new Date().toISOString());
    
    // 根据偏好启用/禁用相应的脚本
    updateAnalyticsScripts(newPreferences);
    
    setShowBanner(false);
    setShowSettings(false);
  };

  // 更新分析脚本
  const updateAnalyticsScripts = (prefs) => {
    // 这里可以根据偏好启用/禁用分析脚本
    if (prefs.analytics) {
      // 启用 Google Analytics 或其他分析工具
      console.log('分析 Cookie 已启用');
      // 例如：gtag('consent', 'update', { analytics_storage: 'granted' });
    } else {
      // 禁用分析脚本
      console.log('分析 Cookie 已禁用');
      // 例如：gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  };

  // 接受所有 Cookie
  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  // 拒绝所有非必要 Cookie
  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  // 保存自定义偏好
  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  // 重置偏好设置
  const resetPreferences = () => {
    localStorage.removeItem('cookie_consent');
    localStorage.removeItem('cookie_consent_timestamp');
    setShowBanner(true);
    setShowSettings(false);
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <>
      {/* Cookie 横幅 */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-orange-600 mt-1" />
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Cookie 使用通知
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    我们使用 Cookie 来改善您的体验、分析网站使用情况并提供个性化内容。
                    您可以选择接受所有 Cookie 或自定义您的偏好设置。
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      必要 Cookie
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      分析 Cookie
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      偏好 Cookie
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={acceptAll}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      接受所有
                    </Button>
                    <Button size="sm" variant="outline" onClick={rejectAll}>
                      <XCircle className="h-4 w-4 mr-1" />
                      仅必要
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-1" />
                      自定义设置
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cookie 设置面板 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-medium">Cookie 偏好设置</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                您可以自定义我们使用的 Cookie 类型。某些 Cookie 对于网站的基本功能是必需的。
              </p>
              
              <div className="space-y-6">
                {/* 必要 Cookie */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-green-600" />
                      <h3 className="font-medium text-green-800">必要 Cookie</h3>
                      <Badge variant="outline" className="text-xs">必需</Badge>
                    </div>
                    <p className="text-sm text-green-700">
                      这些 Cookie 对于网站的基本功能是必需的，包括登录状态、安全性和基本设置。
                    </p>
                  </div>
                  <Switch checked={preferences.necessary} disabled />
                </div>
                
                {/* 分析 Cookie */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium text-blue-800">分析 Cookie</h3>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      帮助我们了解网站使用情况，改善用户体验。数据已匿名化处理。
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.analytics} 
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    } 
                  />
                </div>
                
                {/* 偏好 Cookie */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-purple-600" />
                      <h3 className="font-medium text-purple-800">偏好 Cookie</h3>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-purple-700">
                      记住您的设置和偏好，提供个性化的用户体验。
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.preferences} 
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, preferences: checked }))
                    } 
                  />
                </div>
                
                {/* 营销 Cookie */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-orange-600" />
                      <h3 className="font-medium text-orange-800">营销 Cookie</h3>
                      <Badge variant="outline" className="text-xs">可选</Badge>
                    </div>
                    <p className="text-sm text-orange-700">
                      用于显示相关广告和营销内容。目前我们暂未使用此类 Cookie。
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.marketing} 
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, marketing: checked }))
                    } 
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button variant="outline" onClick={resetPreferences}>
                  重置设置
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    取消
                  </Button>
                  <Button onClick={saveCustomPreferences}>
                    保存设置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
