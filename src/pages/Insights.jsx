
import React, { useState, useEffect, useCallback } from "react";
import { Task } from "@/api/entities";
import { Insight } from "@/api/entities";
import { Reflection } from "@/api/entities";
import { InsightFeedback } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, RefreshCw, Loader2, Sparkles, MessageSquare, PenTool, History } from "lucide-react";
import { format, startOfWeek, endOfWeek, subDays, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AI_ENABLED, AI_DAILY_ENABLED, AI_WEEKLY_ENABLED } from "../components/ai/flags";
import { generateDailyInsight, generateWeeklyInsight } from "../components/ai/service";
import { generateChecksum } from "../components/ai/types";
import { useLanguage } from "@/components/i18n/LanguageContext";
import FeedbackWidget from "../components/FeedbackWidget";
import ReflectionEditor from "../components/ReflectionEditor";
import ReactMarkdown from 'react-markdown';

// BEGIN: Enhanced payload builders with deep insights
function buildDailyPayload(tasks, date, userId) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  // 基础分类统计
  const categoryMap = {};
  tasks.forEach(t => {
    const cat = t.ai_category || "其他";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, total: 0, completed: 0, completionRate: 0, avgCompletionTime: 0, completionTimes: [] };
    }
    categoryMap[cat].total++;
    if (t.completed) {
      categoryMap[cat].completed++;
      
      // 计算完成时间（从创建到完成的小时数）
      if (t.completed_at && t.created_date) {
        const completionTime = (new Date(t.completed_at) - new Date(t.created_date)) / (1000 * 60 * 60);
        categoryMap[cat].completionTimes.push(completionTime);
      }
    }
  });

  // 计算每个类别的平均完成时间
  const categoryStats = Object.values(categoryMap).map(stat => {
    const avgTime = stat.completionTimes.length > 0 
      ? stat.completionTimes.reduce((a, b) => a + b, 0) / stat.completionTimes.length 
      : 0;
    return {
      ...stat,
      completionRate: stat.total > 0 ? stat.completed / stat.total : 0,
      avgCompletionTime: avgTime
    };
  });

  // 延期任务分析
  const rolloverTasks = tasks.filter(t => (t.rollover_count || 0) > 0);
  const rolloverByCategory = {};
  rolloverTasks.forEach(t => {
    const cat = t.ai_category || "其他";
    if (!rolloverByCategory[cat]) {
      rolloverByCategory[cat] = { count: 0, avgRolloverCount: 0, totalRollovers: 0 };
    }
    rolloverByCategory[cat].count++;
    rolloverByCategory[cat].totalRollovers += t.rollover_count || 0;
  });

  // 计算每个类别的平均延期次数
  Object.keys(rolloverByCategory).forEach(cat => {
    rolloverByCategory[cat].avgRolloverCount = 
      rolloverByCategory[cat].count > 0 ? rolloverByCategory[cat].totalRollovers / rolloverByCategory[cat].count : 0;
  });

  // 任务完成时间分析
  const completedTasksWithTime = tasks.filter(t => t.completed && t.completed_at);
  const completionTimeAnalysis = {
    morning: completedTasksWithTime.filter(t => {
      const hour = new Date(t.completed_at).getHours();
      return hour >= 6 && hour < 12;
    }).length,
    afternoon: completedTasksWithTime.filter(t => {
      const hour = new Date(t.completed_at).getHours();
      return hour >= 12 && hour < 18;
    }).length,
    evening: completedTasksWithTime.filter(t => {
      const hour = new Date(t.completed_at).getHours();
      return hour >= 18 && hour < 24;
    }).length
  };

  // 找出完成效率最高和最低的类别
  const sortedByCompletion = [...categoryStats].sort((a, b) => b.completionRate - a.completionRate);
  const bestPerformingCategory = sortedByCompletion[0]?.category || "无";
  const worstPerformingCategory = sortedByCompletion[sortedByCompletion.length - 1]?.category || "无";

  // 最常延期的类别
  const mostRolloverCategory = Object.entries(rolloverByCategory)
    .sort((a, b) => b[1].avgRolloverCount - a[1].avgRolloverCount)[0]?.[0] || "无";

  return {
    userId,
    date,
    totalTasks,
    completedTasks,
    incompleteTasks: totalTasks - completedTasks,
    completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    categoryStats,
    rolloverAnalysis: {
      totalRolloverTasks: rolloverTasks.length,
      rolloverByCategory,
      mostRolloverCategory,
      avgRolloverCount: rolloverTasks.length > 0 
        ? rolloverTasks.reduce((sum, t) => sum + (t.rollover_count || 0), 0) / rolloverTasks.length 
        : 0
    },
    completionTimeAnalysis,
    patterns: {
      bestPerformingCategory,
      worstPerformingCategory,
      mostProductiveTimeSlot: Object.entries(completionTimeAnalysis)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "morning"
    }
  };
}

function buildWeeklyPayload(tasks, weekStart, weekEnd, userId) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  // 按日期分组统计
  const dailyStatsMap = {};
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
    dailyStatsMap[date] = { date, completed: 0, total: 0, completionRate: 0 };
  }

  // 类别统计
  const categoryMap = {};
  const taskLoadAnalysis = {}; // 每日任务量分析

  tasks.forEach(task => {
    const cat = task.ai_category || "其他";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { 
        category: cat, 
        total: 0, 
        completed: 0, 
        completionRate: 0,
        avgCompletionTime: 0, 
        rolloverCount: 0
      };
    }
    categoryMap[cat].total++;
    if (task.completed) categoryMap[cat].completed++;
    if ((task.rollover_count || 0) > 0) {
      categoryMap[cat].rolloverCount += task.rollover_count;
    }

    const taskDate = format(new Date(task.date), 'yyyy-MM-dd'); // Ensure task.date is formatted
    if (dailyStatsMap[taskDate]) {
      dailyStatsMap[taskDate].total++;
      if (task.completed) dailyStatsMap[taskDate].completed++;
    }

    // 按日期分组，分析任务量与完成率的关系
    if (!taskLoadAnalysis[taskDate]) {
      taskLoadAnalysis[taskDate] = { total: 0, completed: 0 };
    }
    taskLoadAnalysis[taskDate].total++;
    if (task.completed) taskLoadAnalysis[taskDate].completed++;
  });

  // 计算每日完成率
  Object.values(dailyStatsMap).forEach(day => {
    day.completionRate = day.total > 0 ? day.completed / day.total : 0;
  });

  const categoryStats = Object.values(categoryMap).map(stat => ({
    ...stat,
    completionRate: stat.total > 0 ? stat.completed / stat.total : 0,
  }));

  const dailyStats = Object.values(dailyStatsMap);
  dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 找出最优任务量模式
  const loadPerformanceMap = {}; // 任务量区间 -> 平均完成率
  Object.values(taskLoadAnalysis).forEach(day => {
    const loadRange = getTaskLoadRange(day.total);
    if (!loadPerformanceMap[loadRange]) {
      loadPerformanceMap[loadRange] = { totalDays: 0, totalCompletionRate: 0, avgRate: 0 };
    }
    loadPerformanceMap[loadRange].totalDays++;
    loadPerformanceMap[loadRange].totalCompletionRate += (day.total > 0 ? day.completed / day.total : 0);
  });

  Object.keys(loadPerformanceMap).forEach(range => {
    const data = loadPerformanceMap[range];
    data.avgRate = data.totalDays > 0 ? data.totalCompletionRate / data.totalDays : 0;
  });

  // 找出效率最高的任务量区间
  const bestLoadRange = Object.entries(loadPerformanceMap)
    .sort((a, b) => b[1].avgRate - a[1].avgRate)[0]?.[0] || "中等";

  // 修复这里的排序错误
  const productiveDays = [...dailyStats].sort((a, b) => b.completionRate - a.completionRate);
  const categoryPerformance = [...categoryStats].sort((a, b) => b.completionRate - a.completionRate);

  return {
    userId,
    weekStart,
    weekEnd,
    totalTasks,
    completedTasks,
    totalCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    categoryStats,
    dailyStats,
    taskLoadAnalysis: {
      loadPerformanceMap,
      bestLoadRange,
      optimalTaskCount: getOptimalTaskCountFromRange(bestLoadRange)
    },
    trends: {
      mostProductiveDay: productiveDays[0]?.date || "N/A",
      leastProductiveDay: productiveDays[productiveDays.length - 1]?.date || "N/A",
      bestPerformingCategory: categoryPerformance[0]?.category || "N/A",
      worstPerformingCategory: categoryPerformance[categoryPerformance.length - 1]?.category || "N/A",
      consistencyScore: calculateConsistencyScore(dailyStats)
    }
  };
}

// 辅助函数：将任务数量映射到区间
function getTaskLoadRange(taskCount) {
  if (taskCount <= 3) return "少量";
  if (taskCount <= 7) return "适中";
  if (taskCount <= 12) return "较多";
  return "过多";
}

function getOptimalTaskCountFromRange(range) {
  const rangeMap = { "少量": "1-3", "适中": "4-7", "较多": "8-12", "过多": "13+" };
  return rangeMap[range] || "4-7";
}

// 辅助函数：计算一致性得分
function calculateConsistencyScore(dailyStats) {
  if (dailyStats.length === 0) return 0;
  const rates = dailyStats.map(d => d.completionRate);
  
  // Calculate mean
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  
  // Calculate variance
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / rates.length;
  
  // Normalize score: 1 - (normalized variance). Max variance is 0.25 (e.g., 0,0,1,1 -> avg 0.5, variance 0.25)
  // We want higher score for lower variance, so 1 - variance is a simple inverse.
  // Clamp to 0 and 1.
  return Math.max(0, Math.min(1, 1 - (variance * 4))); // Multiplying variance by 4 to normalize 0-0.25 to 0-1 range
}
// END

// BEGIN: render & feedback card
function InsightCard({ insight }) {
  const { t } = useLanguage();
  const data = (() => { try { return JSON.parse(insight.content_json || "{}"); } catch { return {}; } })();

  if (Object.keys(data).length === 0) {
    return (
      <Card className="bg-white/50 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t('insights.generationFailed')}</CardTitle>
          <CardDescription>
              {t('insights.generationFailedDesc')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/50 border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{data.summary}</CardTitle>
        <CardDescription>
            {t('insights.analysisTime', { time: format(new Date(insight.created_at), 'yyyy-MM-dd HH:mm') })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="prose prose-slate max-w-none">
            <h3 className="font-semibold">{t('insights.highlights')}</h3>
            <ul className="list-disc pl-5">
              {data.highlights?.map((h, i) => (
                <li key={i}>
                  <ReactMarkdown className="inline">{h}</ReactMarkdown>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">{t('insights.recommendations')}</h3>
            <ul className="list-disc pl-5">
              {data.recommendations?.map((r, i) => (
                <li key={i}>
                  <ReactMarkdown className="inline">{r}</ReactMarkdown>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">{t('insights.detailedContent')}</h3>
            <div className="whitespace-pre-line">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <FeedbackWidget insightId={insight.id} insightType={insight.type} />
      </CardFooter>
    </Card>
  );
}
// END

export default function Insights() {
  const [dailyInsight, setDailyInsight] = useState(null);
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [todayReflection, setTodayReflection] = useState(null);
  const [showReflectionEditor, setShowReflectionEditor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t, language } = useLanguage();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const loadInsights = useCallback(async () => {
    setIsGenerating(true);
    try {
      const dailyInsights = await Insight.filter({ type: "daily", date: todayStr });
      if (dailyInsights.length > 0) setDailyInsight(dailyInsights[0]);

      const weeklyInsights = await Insight.filter({ type: "weekly", date: weekStartStr });
      if (weeklyInsights.length > 0) setWeeklyInsight(weeklyInsights[0]);
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [todayStr, weekStartStr]);

  const loadTodayReflection = useCallback(async () => {
    try {
      const reflections = await Reflection.filter({ date: todayStr });
      if (reflections.length > 0) {
        setTodayReflection(reflections[0]);
      }
    } catch (error) {
      console.error("Failed to load today's reflection:", error);
    }
  }, [todayStr]);

  useEffect(() => {
    loadInsights();
    loadTodayReflection();
  }, [loadInsights, loadTodayReflection]);

  const handleGenerateDaily = async () => {
    setIsGenerating(true);
    try {
      const user = await User.me();
      // Using todayStr from component scope
      const tasks = await Task.filter({ date: todayStr });
      
      const payload = buildDailyPayload(tasks, todayStr, user.id);
      
      const res = await generateDailyInsight({ ...payload, locale: language });
      
      const existing = await Insight.filter({ type: "daily", date: todayStr });
      const insightData = {
        type: "daily",
        date: todayStr,
        content: "deprecated", // 旧字段填充
        content_json: JSON.stringify(res.json),
        prompt_version: res.prompt_version,
        ai_source: res.source,
        checksum: res.checksum,
        created_at: res.created_at
      };
      
      let newInsight;
      if (existing.length > 0) {
        newInsight = await Insight.update(existing[0].id, insightData);
      } else {
        newInsight = await Insight.create(insightData);
      }
      setDailyInsight(newInsight);

    } catch (error) {
      console.error("生成每日洞察失败:", error);
      alert(t("insights.generationFailedAlertDaily")); // Using i18n
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWeekly = async () => {
    setIsGenerating(true);
    try {
      const user = await User.me();
      // Set weekStartsOn: 1 for Monday as the start of the week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const tasks = [];
      for (let i = 0; i < 7; i++) {
          const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
          tasks.push(...await Task.filter({ date }));
      }
      
      // Using weekStartStr from component scope
      const payload = buildWeeklyPayload(tasks, weekStartStr, weekEndStr, user.id);
      
      const res = await generateWeeklyInsight({ ...payload, locale: language });
      
      const existing = await Insight.filter({ type: "weekly", date: weekStartStr });
      const insightData = {
        type: "weekly",
        date: weekStartStr,
        content: "deprecated",
        content_json: JSON.stringify(res.json),
        prompt_version: res.prompt_version,
        ai_source: res.source,
        checksum: res.checksum,
        created_at: res.created_at
      };
      
      let newInsight;
      if (existing.length > 0) {
        newInsight = await Insight.update(existing[0].id, insightData);
      } else {
        newInsight = await Insight.create(insightData);
      }
      setWeeklyInsight(newInsight);

    } catch (error) {
      console.error("生成每周洞察失败:", error);
      alert(t("insights.generationFailedAlertWeekly")); // Using i18n
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReflectionSave = async (reflectionData) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const payload = {
        ...reflectionData,
        date: today,
      };

      if (todayReflection) {
        const updated = await Reflection.update(todayReflection.id, payload);
        setTodayReflection(updated);
      } else {
        const created = await Reflection.create(payload);
        setTodayReflection(created);
      }
      setShowReflectionEditor(false);
    } catch (error) {
      console.error("保存复盘失败:", error);
      alert(t("reflection.saveFailed")); // Using i18n
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('insights.title')}</h1>
        <p className="text-slate-600">{t('insights.subtitle')}</p>
      </motion.div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="daily" className="rounded-lg">{t('insights.dailyReview')}</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg">{t('insights.weeklyReview')}</TabsTrigger>
          <TabsTrigger value="reflection" className="rounded-lg">{t('insights.myReflection')}</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-600" />
                {t('insights.dailyInsight')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyInsight && dailyInsight.content_json ? (
                <div className="space-y-4">
                  <InsightCard insight={dailyInsight} />
                   <Button
                      variant="outline"
                      onClick={handleGenerateDaily}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
                      {t('insights.regenerate')}
                    </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 mb-6">{t('insights.noInsightYet', { type: t('insights.daily') })}</p>
                  {AI_ENABLED && AI_DAILY_ENABLED && (
                    <Button
                      onClick={handleGenerateDaily}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white gap-2"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                      {isGenerating ? t('insights.analyzing') : t('insights.generateInsight', { type: t('insights.daily') })}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                {t('insights.weeklyInsight')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyInsight && weeklyInsight.content_json ? (
                 <div className="space-y-4">
                  <InsightCard insight={weeklyInsight} />
                   <Button
                      variant="outline"
                      onClick={handleGenerateWeekly}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
                      {t('insights.regenerate')}
                    </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 mb-6">{t('insights.noInsightYet', { type: t('insights.weekly') })}</p>
                  {AI_ENABLED && AI_WEEKLY_ENABLED && (
                    <Button
                      onClick={handleGenerateWeekly}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white gap-2"
                    >
                       {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                       {isGenerating ? t('insights.analyzing') : t('insights.generateInsight', { type: t('insights.weekly') })}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reflection" className="space-y-6">
          {showReflectionEditor ? (
            <ReflectionEditor
              date={format(new Date(), 'yyyy-MM-dd')}
              existingReflection={todayReflection}
              onSave={handleReflectionSave}
              onCancel={() => setShowReflectionEditor(false)}
            />
          ) : (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-purple-600" />
                  {t('insights.todayReflection')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayReflection ? (
                  <div className="space-y-4">
                    <div className="prose prose-slate max-w-none">
                      <p className="whitespace-pre-line">{todayReflection.content}</p>
                      {todayReflection.key_insights && todayReflection.key_insights.length > 0 && (
                        <div>
                          <h4 className="font-semibold mt-4">{t('reflection.keyInsights')}</h4>
                          <ul className="list-disc pl-5">
                            {todayReflection.key_insights.map((insight, i) => <li key={i}>{insight}</li>)}
                          </ul>
                        </div>
                      )}
                      {todayReflection.tomorrow_plan && (
                        <div>
                          <h4 className="font-semibold mt-4">{t('reflection.tomorrowPlan')}</h4>
                          <p>{todayReflection.tomorrow_plan}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => setShowReflectionEditor(true)} size="sm">
                        <PenTool className="w-4 h-4 mr-2" />
                        {t('reflection.edit')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PenTool className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('reflection.emptyState.title')}</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">{t('reflection.emptyState.description')}</p>
                    <Button 
                      onClick={() => setShowReflectionEditor(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-2"
                    >
                      <PenTool className="w-4 h-4" />
                      {t('reflection.writeToday')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
