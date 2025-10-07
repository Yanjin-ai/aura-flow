
import React, { useState, useEffect } from "react";
import { Task } from "@/api/entities";
import { User } from "@/api/entities";
import { directDb } from "../lib/platform/db-direct";
import { format } from "date-fns";
import SmartTaskInput from "../components/SmartTaskInput";
import TaskList from "../components/TaskList";
import DateNavigator from "../components/DateNavigator";
import { setOnTaskCategoryResolved } from "../components/ai/queue";
import { enqueueTaskForClassification } from "../components/ai/queue";
import { AI_ENABLED, AI_CLASSIFY_ENABLED } from "../components/ai/flags";
import PendingTasksPanel from "../components/PendingTasksPanel";
import WelcomeGuide from "../components/WelcomeGuide";

export default function DayView() {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  useEffect(() => {
    // 检查是否需要显示欢迎指引
    const checkWelcomeGuide = async () => {
      try {
        const user = await User.me();
        if (user && user.has_seen_welcome_guide === false) {
          setShowWelcomeGuide(true);
        }
      } catch (error) {
        console.error("Failed to check user for welcome guide:", error);
        // 开发模式：如果 API 调用失败，不显示欢迎指引
        if (import.meta.env.DEV) console.log("开发模式：跳过欢迎指引检查");
      }
    };
    
    checkWelcomeGuide();

    // 注册AI分类回调
    setOnTaskCategoryResolved(async ({ taskId, result }) => {
      try {
        if (import.meta.env.DEV) console.log(`AI result received for task ${taskId}, writing back...`, result);
        const updatedFields = {
          ai_category: result.category,
          ai_confidence: result.confidence,
          ai_secondary: result.secondary ?? null,
          ai_source: result.source,
          ai_updated_at: Date.now(),
        };
        await Task.update(taskId, updatedFields);
        
        // 刷新UI以显示新分类
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updatedFields } : task
        ));

      } catch (e) {
        console.warn("AI classify writeback failed", e);
      }
    });
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        // 使用直接数据库服务，绕过 API 函数
        const fetchedTasks = await directDb.getTasks(undefined, dateStr);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        // 开发模式：如果 API 调用失败，使用空数组
        if (import.meta.env.DEV) console.log("开发模式：使用空任务列表");
        setTasks([]);
      }
    };

    loadTasks();
  }, [currentDate]);
  
  const handleCloseWelcomeGuide = async () => {
    setShowWelcomeGuide(false);
    try {
      await User.updateMyUserData({ has_seen_welcome_guide: true });
    } catch (error) {
      console.error("Failed to update user welcome guide status:", error);
      // 开发模式：即使更新失败也继续
      if (import.meta.env.DEV) console.log("开发模式：跳过用户数据更新");
    }
  };

  const addTask = async (taskData) => {
    setIsLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const maxOrder = Math.max(...tasks.map(t => t.order_index || 0), 0);

      // taskData 现在包含解析后的所有信息
      const newTaskData = {
        title: taskData.content, // 将 content 映射到 title
        content: taskData.content, // 保持向后兼容
        date: taskData.date || dateStr,
        order_index: maxOrder + 1,
        completed: false,
        ai_category: taskData.category,
        due_time: taskData.due_time,
        // 可以添加更多字段来存储标签、优先级等
        ...taskData
      };
      
      // 使用直接数据库服务，绕过 API 函数
      const newTask = await directDb.createTask(newTaskData);

      // AI自动分类队列处理（如果还没有分类的话）
      if (AI_ENABLED && AI_CLASSIFY_ENABLED && newTask?.id && !taskData.category) {
        enqueueTaskForClassification({
          taskId: newTask.id,
          text: newTask.content || "",
          locale: "zh-CN",
        });
      }
      
      setTasks(prev => [newTask, ...prev]);
    } catch (error) {
      console.error("添加任务失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (task) => {
    // 使用直接数据库服务，绕过 API 函数
    const updatedTask = await directDb.updateTask(task.id, {
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null
    });

    setTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, ...updatedTask } : t)
    );
  };

  const reorderTasks = async (sourceIndex, destinationIndex) => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    const reorderedTasks = Array.from(incompleteTasks);
    const [removed] = reorderedTasks.splice(sourceIndex, 1);
    reorderedTasks.splice(destinationIndex, 0, removed);

    // 更新本地状态
    const completedTasks = tasks.filter(t => t.completed);
    setTasks([...reorderedTasks, ...completedTasks]);

    // 更新数据库中的order_index
    for (let i = 0; i < reorderedTasks.length; i++) {
      await directDb.updateTask(reorderedTasks[i].id, {
        order_index: reorderedTasks.length - i
      });
    }
  };
  
  const handleUpdateTask = async (taskId, data) => {
    await directDb.updateTask(taskId, data);
    // 刷新UI
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, ...data } : task
    ));
  };

  const handleTasksRolledOver = (count) => {
    // 当任务被延期后，刷新当前任务列表
    const reloadTasks = async () => {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const fetchedTasks = await directDb.getTasks(undefined, dateStr);
      setTasks(fetchedTasks);
    };
    reloadTasks();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <DateNavigator 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      <PendingTasksPanel
        currentDate={currentDate}
        onTasksRolledOver={handleTasksRolledOver}
      />
      
      <SmartTaskInput 
        onAddTask={addTask}
        isLoading={isLoading}
      />

      <TaskList
        tasks={tasks}
        onToggleComplete={toggleComplete}
        onReorderTasks={reorderTasks}
        onUpdateTask={handleUpdateTask}
      />
      
      <WelcomeGuide
        isOpen={showWelcomeGuide}
        onClose={handleCloseWelcomeGuide}
      />
    </div>
  );
}
