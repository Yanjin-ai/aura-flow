
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Clock, Bell, Brain, Save, CheckCircle, Sparkles, User as UserIcon, Globe, Shield, Beaker, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../components/i18n/LanguageContext";
import { AI_ENABLED } from "../components/ai/flags";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { language, changeLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    auto_rollover_enabled: true,
    auto_rollover_days: 3,
    rollover_notification_enabled: true,
    ai_daily_insights: true,
    ai_weekly_insights: true,
    ai_url_extraction: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      setSettings({
        auto_rollover_enabled: currentUser.auto_rollover_enabled ?? true,
        auto_rollover_days: currentUser.auto_rollover_days ?? 3,
        rollover_notification_enabled: currentUser.rollover_notification_enabled ?? true,
        ai_daily_insights: currentUser.ai_daily_insights ?? true,
        ai_weekly_insights: currentUser.ai_weekly_insights ?? true,
        ai_url_extraction: currentUser.ai_url_extraction ?? true
      });
    } catch (error) {
      console.error("Failed to load user settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLanguageChange = async (newLanguage) => {
    await changeLanguage(newLanguage);
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await User.updateMyUserData(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("保存设置失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 处理用户登出
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-orange-600" />
          {t('settings.title')}
        </h1>
        <p className="text-slate-600">{t('settings.subtitle')}</p>
      </motion.div>

      <div className="space-y-6">
        {/* 个人资料卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center font-semibold">
                  {user?.full_name ? user.full_name[0].toUpperCase() : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-semibold">{user?.full_name || 'User'}</h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        {/* 语言设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>
                {t('settings.languageDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">{t('settings.languages.zh-CN')}</SelectItem>
                  <SelectItem value="en-US">{t('settings.languages.en-US')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 智能设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                {t('settings.aiSettings')}
              </CardTitle>
              <CardDescription>
                {t('settings.aiSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 智能洞察 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{t('settings.dailyInsights')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('settings.dailyInsightsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.ai_daily_insights}
                  onCheckedChange={(checked) => handleSettingChange('ai_daily_insights', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{t('settings.weeklyInsights')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('settings.weeklyInsightsDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.ai_weekly_insights}
                  onCheckedChange={(checked) => handleSettingChange('ai_weekly_insights', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{t('settings.urlExtraction')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('settings.urlExtractionDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.ai_url_extraction}
                  onCheckedChange={(checked) => handleSettingChange('ai_url_extraction', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 任务管理设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {t('settings.taskSettings')}
              </CardTitle>
              <CardDescription>
                {t('settings.taskSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 启用延期提醒 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{t('settings.autoRollover')}</h4>
                  <p className="text-sm text-slate-600">
                    {t('settings.autoRolloverDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.auto_rollover_enabled}
                  onCheckedChange={(checked) => handleSettingChange('auto_rollover_enabled', checked)}
                />
              </div>

              {/* 延期范围设置 */}
              {settings.auto_rollover_enabled && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('settings.rolloverRange')}</h4>
                    <Select
                      value={settings.auto_rollover_days.toString()}
                      onValueChange={(value) => handleSettingChange('auto_rollover_days', parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('settings.rolloverDays.1')}</SelectItem>
                        <SelectItem value="3">{t('settings.rolloverDays.3')}</SelectItem>
                        <SelectItem value="7">{t('settings.rolloverDays.7')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-500" />
                        <h4 className="font-medium">{t('settings.rolloverNotification')}</h4>
                      </div>
                      <p className="text-sm text-slate-600">
                        {t('settings.rolloverNotificationDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.rollover_notification_enabled}
                      onCheckedChange={(checked) => handleSettingChange('rollover_notification_enabled', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 数据管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Shield className="w-5 h-5" />
                数据管理
              </CardTitle>
              <CardDescription>
                管理您的个人数据，符合 GDPR 和其他隐私法规
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-800">导出我的数据</h4>
                  <p className="text-sm text-red-600">下载您的所有个人数据</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/data-management', '_blank')}
                >
                  导出数据
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-800">删除我的数据</h4>
                  <p className="text-sm text-red-600">永久删除您的账户和所有数据</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => window.open('/data-management', '_blank')}
                >
                  删除数据
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-800">实验功能</h4>
                  <p className="text-sm text-blue-600">查看和管理新功能访问权限</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/experimental-features', '_blank')}
                >
                  管理功能
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 保存按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 h-12"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                {t('common.saving')}
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('common.saved')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('common.save')}
              </>
            )}
          </Button>
        </motion.div>

        {/* 登出按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 h-12"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
