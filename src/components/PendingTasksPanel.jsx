
import React, { useState, useEffect } from "react";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, X, Calendar, CheckCircle2 } from "lucide-react";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from './i18n/LanguageContext';

export default function PendingTasksPanel({ currentDate, onTasksRolledOver }) {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [userSettings, setUserSettings] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const checkForPendingTasks = async () => {
      try {
        const user = await User.me();
        setUserSettings(user);

        // 检查用户是否启用了延期功能
        if (!user.auto_rollover_enabled) {
          return;
        }

        const today = format(currentDate, 'yyyy-MM-dd');
        const checkDays = user.auto_rollover_days || 3;
        
        // 检查用户是否已经忽略了今天的延期建议
        const dismissedDates = user.dismissed_rollover_dates || [];
        if (dismissedDates.includes(today)) {
          return;
        }

        // 获取过去N天的未完成任务
        const tasks = [];
        for (let i = 1; i <= checkDays; i++) {
          const checkDate = format(subDays(currentDate, i), 'yyyy-MM-dd');
          const dayTasks = await Task.filter({ date: checkDate, completed: false });
          tasks.push(...dayTasks.map(task => ({ ...task, originalDate: checkDate })));
        }

        if (tasks.length > 0 && user.rollover_notification_enabled) {
          setPendingTasks(tasks);
          setShowSuggestion(true);
        }
      } catch (error) {
        console.error("Failed to check pending tasks:", error);
      }
    };

    checkForPendingTasks();
  }, [currentDate]);

  const handleRollOverSelected = async (selectedTasks = null) => {
    setIsProcessing(true);
    try {
      const tasksToRollOver = selectedTasks || pendingTasks;
      const today = format(currentDate, 'yyyy-MM-dd');

      for (const task of tasksToRollOver) {
        // 获取当前的延期历史，如果不存在则初始化为空数组
        const currentRolloverHistory = task.rollover_history || [];
        const currentRolloverCount = task.rollover_count || 0;
        
        // 将原始日期添加到延期历史中
        const updatedRolloverHistory = [...currentRolloverHistory, task.originalDate || task.date]; // Use originalDate if available, otherwise task.date
        
        await Task.update(task.id, {
          date: today,
          order_index: (task.order_index || 0) + 1000, // 确保延期任务排在新任务后面
          rollover_history: updatedRolloverHistory,
          rollover_count: currentRolloverCount + 1
        });
      }

      setShowSuggestion(false);
      setPendingTasks([]);
      
      if (onTasksRolledOver) {
        onTasksRolledOver(tasksToRollOver.length);
      }
    } catch (error) {
      console.error("Failed to roll over tasks:", error);
      alert(t('common.rolloverFailed')); // Using t() for alert message
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const today = format(currentDate, 'yyyy-MM-dd');
      const currentDismissed = userSettings.dismissed_rollover_dates || [];
      
      await User.updateMyUserData({
        dismissed_rollover_dates: [...currentDismissed, today]
      });

      setShowSuggestion(false);
      setPendingTasks([]);
    } catch (error) {
      console.error("Failed to dismiss suggestion:", error);
    }
  };

  const groupTasksByDate = () => {
    const groups = {};
    pendingTasks.forEach(task => {
      if (!groups[task.originalDate]) {
        groups[task.originalDate] = [];
      }
      groups[task.originalDate].push(task);
    });
    return groups;
  };

  if (!showSuggestion || pendingTasks.length === 0) {
    return null;
  }

  const taskGroups = groupTasksByDate();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="mb-6"
      >
        <Card className="border-2 border-blue-200 bg-blue-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="text-base font-medium">
                  {t('pendingTasks.title', { count: pendingTasks.length })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDetails ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700">
                  {t('pendingTasks.description')}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => handleRollOverSelected()}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {t('pendingTasks.moveAllToday')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(true)}
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('pendingTasks.viewDetails')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-slate-600"
                  >
                    {t('pendingTasks.ignoreTemporarily')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-800">{t('pendingTasks.selectTasks')}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    {t('pendingTasks.collapse')}
                  </Button>
                </div>
                
                {Object.entries(taskGroups).map(([date, tasks]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-slate-600">
                        {format(parseISO(date), 'MM月dd日', { locale: zhCN })}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {t('pendingTasks.tasksCount', { count: tasks.length })}
                      </span>
                    </div>
                    <div className="space-y-2 pl-4">
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          <span className="flex-1 text-sm text-slate-700">
                            {task.content}
                          </span>
                          {task.ai_category && (
                            <Badge variant="outline" className="text-xs">
                              {task.ai_category}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleRollOverSelected()}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {t('pendingTasks.moveAllToday')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                  >
                    {t('pendingTasks.ignoreTemporarily')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
