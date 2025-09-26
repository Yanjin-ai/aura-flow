
import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { LOW_CONFIDENCE_THRESHOLD, AI_ENABLED, AI_CLASSIFY_ENABLED } from "./ai/flags";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "./i18n/LanguageContext";

export default function TaskItem({ task, onToggleComplete, onUpdateTask }) {
  const { t, language } = useLanguage(); // 在组件顶层调用 hook
  
  const categoryColors = {
    "工作": "bg-blue-100 text-blue-700",
    "Work": "bg-blue-100 text-blue-700",
    "学习": "bg-purple-100 text-purple-700", 
    "Study": "bg-purple-100 text-purple-700",
    "生活": "bg-green-100 text-green-700",
    "Life": "bg-green-100 text-green-700",
    "健康": "bg-red-100 text-red-700",
    "Health": "bg-red-100 text-red-700",
    "娱乐": "bg-yellow-100 text-yellow-700",
    "Entertainment": "bg-yellow-100 text-yellow-700",
    "其他": "bg-gray-100 text-gray-700",
    "Other": "bg-gray-100 text-gray-700"
  };

  const isLowConfidence = AI_ENABLED && AI_CLASSIFY_ENABLED && task.ai_category && (task.ai_confidence ?? 1) < LOW_CONFIDENCE_THRESHOLD;

  const handleReclassify = async () => {
    // 现在可以直接使用 language 变量
    const allowedCategories = language === 'en-US' 
      ? ["Work", "Study", "Life", "Health", "Entertainment", "Other"]
      : ["工作", "学习", "生活", "健康", "娱乐", "其他"];
    
    const nextCategory = window.prompt(
      `${language === 'en-US' ? 'Please select the correct category:' : '请选择正确的类目：'}\n${allowedCategories.join(" / ")}`, 
      task.ai_category || (language === 'en-US' ? "Other" : "其他")
    );

    if (nextCategory && allowedCategories.includes(nextCategory)) {
      if(onUpdateTask) {
        onUpdateTask(task.id, {
          ai_category: nextCategory,
          ai_confidence: 1.0,
          ai_secondary: null
        });
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      draggable
      className={`group relative bg-white rounded-xl p-4 shadow-sm border transition-all duration-300 cursor-grab active:cursor-grabbing ${
        task.completed
          ? "opacity-60 border-slate-200"
          : "border-slate-200 hover:border-orange-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggleComplete(task)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 hover:border-orange-400"
          }`}
        >
          {task.completed && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-base transition-all duration-300 ${
              task.completed
                ? "line-through text-slate-400"
                : "text-slate-800"
            }`}
          >
            {task.title || task.content}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.ai_category && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  categoryColors[task.ai_category] || categoryColors["其他"] || categoryColors["Other"]
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {task.ai_category}
              </span>
            )}

            {/* 显示延期次数 */}
            {task.rollover_count > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                延期 {task.rollover_count} 次
              </Badge>
            )}

            {isLowConfidence && (
              <Badge
                variant="outline"
                className="cursor-pointer border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                onClick={handleReclassify}
              >
                {t('taskItem.categoryConfirmation')}
              </Badge>
            )}

            {task.completed && task.completed_at && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                <Clock className="w-3 h-3" />
                {format(new Date(task.completed_at), "HH:mm")}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
