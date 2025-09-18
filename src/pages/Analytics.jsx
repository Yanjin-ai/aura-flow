import React, { useState, useEffect, useCallback } from "react";
import { Task } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Clock, Award } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "../components/i18n/LanguageContext";

export default function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completionRate: 0,
    avgTasksPerDay: 0,
    streak: 0
  });

  const { t } = useLanguage();

  const loadAnalyticsData = useCallback(async () => {
    // 获取最近30天的数据
    const allTasks = [];
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayTasks = await Task.filter({ date });
      allTasks.push(...dayTasks.map(task => ({ ...task, date })));
    }

    setTasks(allTasks);
    generateWeeklyData(allTasks);
    generateCategoryData(allTasks);
    calculateStats(allTasks);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const generateWeeklyData = (allTasks) => {
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = allTasks.filter(task => task.date === dateStr);
      const completed = dayTasks.filter(task => task.completed).length;
      
      weekData.push({
        day: format(date, 'E', { locale: zhCN }),
        completed,
        total: dayTasks.length,
        rate: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0
      });
    }
    setWeeklyData(weekData);
  };

  const generateCategoryData = (allTasks) => {
    const categories = {};
    allTasks.forEach(task => {
      if (task.ai_category) {
        if (!categories[task.ai_category]) {
          categories[task.ai_category] = { total: 0, completed: 0 };
        }
        categories[task.ai_category].total++;
        if (task.completed) {
          categories[task.ai_category].completed++;
        }
      }
    });

    const categoryArray = Object.entries(categories).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      rate: Math.round((data.completed / data.total) * 100)
    }));

    setCategoryData(categoryArray);
  };

  const calculateStats = (allTasks) => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 计算连续完成天数
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayTasks = allTasks.filter(task => task.date === date);
      const hasCompletedTask = dayTasks.some(task => task.completed);
      
      if (hasCompletedTask) {
        streak++;
      } else if (dayTasks.length > 0) {
        break;
      }
    }

    setStats({
      totalTasks,
      completionRate,
      avgTasksPerDay: Math.round(totalTasks / 30 * 10) / 10,
      streak
    });
  };

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('analytics.title')}</h1>
        <p className="text-slate-600">{t('analytics.subtitle')}</p>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Target className="w-4 h-4" />
                {t('analytics.totalTasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{stats.totalTasks}</div>
              <p className="text-sm text-slate-500 mt-1">{t('analytics.last30Days')}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <TrendingUp className="w-4 h-4" />
                {t('analytics.completionRate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completionRate}%</div>
              <p className="text-sm text-slate-500 mt-1">{t('analytics.overallPerformance')}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock className="w-4 h-4" />
                {t('analytics.avgTasksPerDay')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.avgTasksPerDay}</div>
              <p className="text-sm text-slate-500 mt-1">{t('analytics.tasksPerDay')}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Award className="w-4 h-4" />
                {t('analytics.streakDays')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.streak}</div>
              <p className="text-sm text-slate-500 mt-1">{t('analytics.consecutiveCompletion')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 图表区域 */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>{t('analytics.weeklyCompletion')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'completed' ? `${value} ${t('analytics.completed')}` : `${value} ${t('analytics.total')}`,
                      name === 'completed' ? t('analytics.completed') : t('analytics.total')
                    ]}
                  />
                  <Bar dataKey="total" fill="#e2e8f0" radius={4} />
                  <Bar dataKey="completed" fill="#f97316" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>{t('analytics.categoryDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>{t('analytics.categoryCompletionDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-700">{category.name}</span>
                        <span className="text-sm text-slate-500">
                          {category.completed}/{category.total} ({category.rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: COLORS[index % COLORS.length],
                            width: `${category.rate}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}