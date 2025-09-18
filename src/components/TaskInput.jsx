import React, { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// 这是原来的简单版本，现在被SmartTaskInput替代
// 保留此文件以防需要回退到简单模式
export default function TaskInput({ onAddTask, isLoading }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onAddTask(content.trim());
      setContent("");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mb-8"
    >
      <div className="relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="添加新任务..."
          disabled={isLoading}
          className="w-full px-6 py-4 text-lg bg-white rounded-2xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 placeholder-slate-400 disabled:opacity-50"
        />
        <div className="absolute right-2 top-2 flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-xl">
              <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
              <span className="text-sm text-orange-700 font-medium">AI分析中</span>
            </div>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.form>
  );
}