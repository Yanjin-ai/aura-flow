
import React, { useState } from "react";
import { Plus, Sparkles, Mic, MicOff, LayoutTemplate, Loader2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "./i18n/LanguageContext";
import { parseNaturalLanguage } from "./utils/naturalLanguageParser";
import TaskTemplates from "./TaskTemplates";

export default function SmartTaskInput({ onAddTask, isLoading }) {
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false); // New state for processing voice after recording stops
  const [voiceError, setVoiceError] = useState(null); // New state for voice recognition errors
  const [recognition, setRecognition] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { t, language } = useLanguage(); // Destructure 'language' from useLanguage hook

  // 初始化语音识别
  React.useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language; // Set recognition language based on current app language

    rec.onstart = () => {
      setIsRecording(true);
      setIsProcessingVoice(false); // Ensure processing state is off when recording starts
      setVoiceError(null); // Clear any previous errors
    };

    rec.onspeechend = () => {
      // User stopped speaking, recognition will now process the audio
      setIsRecording(false); // No longer actively recording
      setIsProcessingVoice(true); // Indicate that processing is underway
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setContent(transcript);
      setIsProcessingVoice(false); // Processing finished, clear processing state
    };

    rec.onerror = (event) => {
      let errorMsg;
      if (event.error === 'no-speech') {
        errorMsg = t('taskInput.noSpeechError'); // "No speech was detected. Please try again."
      } else if (event.error === 'not-allowed') {
        errorMsg = t('taskInput.micPermissionDenied'); // "Microphone permission denied. Please enable it in browser settings."
      } else {
        errorMsg = t('taskInput.voiceError'); // "An error occurred during voice input."
      }
      setVoiceError(errorMsg);
      // Clear error message after 5 seconds
      setTimeout(() => setVoiceError(null), 5000); 
      setIsRecording(false);
      setIsProcessingVoice(false); // Ensure all voice states are reset on error
    };

    rec.onend = () => {
      // Final cleanup of states when recognition session ends for any reason (stop, error, result)
      setIsRecording(false);
      setIsProcessingVoice(false);
    };

    setRecognition(rec);
    
    // Cleanup function: abort any ongoing recognition when component unmounts
    return () => {
      if (rec) {
        rec.abort();
      }
    };
  }, [language, t]); // Depend on language and t to re-initialize if language changes

  // 开始/停止语音录制
  const toggleRecording = () => {
    // Prevent starting if no recognition object or if currently processing a previous voice input
    if (!recognition || isProcessingVoice) return; 
    
    if (isRecording) {
      recognition.stop(); // Stop current recording
    } else {
      recognition.start(); // Start new recording (onstart will set isRecording to true)
    }
  };

  // 处理粘贴事件
  const handlePaste = async (e) => {
    const pastedData = e.clipboardData.getData('text');
    if (pastedData) {
      // 简单的文本清理
      const cleanedText = pastedData
        .replace(/\n+/g, ' ')  // 合并换行
        .replace(/\s+/g, ' ')  // 合并多余空格
        .trim();
      
      setContent(cleanedText);
    }
  };

  // 普通提交
  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      // 使用自然语言解析增强任务内容
      const parsedTask = parseNaturalLanguage(content.trim());
      onAddTask(parsedTask);
      setContent("");
    }
  };

  // 从模板添加任务
  const handleTemplateSelect = (template) => {
    const parsedTask = parseNaturalLanguage(template.content);
    onAddTask(parsedTask);
    setShowTemplates(false);
  };
  
  // Helper function to render the voice button based on its state
  const getVoiceButton = () => {
    let icon;
    let className;
    let title;

    if (voiceError) {
      icon = <XCircle className="w-5 h-5" />;
      className = 'bg-red-100 text-red-600';
      title = voiceError; // Display the actual error message
    } else if (isProcessingVoice) {
      icon = <Loader2 className="w-5 h-5 animate-spin" />;
      className = 'bg-slate-100 text-slate-600 cursor-not-allowed'; // Indicate not clickable
      title = t('taskInput.processingVoice'); // "Processing voice..."
    } else if (isRecording) {
      icon = <Mic className="w-5 h-5" />;
      className = 'bg-red-100 text-red-600 ring-4 ring-red-200 animate-pulse'; // Pulsing red to indicate active recording
      title = t('taskInput.stopVoiceInput'); // "Stop Voice Input"
    } else {
      icon = <Mic className="w-5 h-5" />;
      className = 'bg-slate-100 hover:bg-slate-200 text-slate-600';
      title = t('taskInput.voiceInput'); // "Voice Input"
    }

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isProcessingVoice || !recognition} // Disable if processing or recognition not supported
              className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${className}`}
            >
              {icon}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="mb-8">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
      >
        <div className="relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder={isRecording ? t('taskInput.listening') : t('dayView.addTaskPlaceholder')} // Dynamic placeholder
            disabled={isLoading}
            className={`w-full px-6 py-4 pr-48 text-lg bg-white rounded-2xl border-2 transition-all duration-300 placeholder-slate-400 disabled:opacity-50 ${isRecording ? 'border-orange-400 ring-4 ring-orange-100' : 'border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-100'}`} // Dynamic border/ring
          />
          
          <div className="absolute right-2 top-2 flex items-center gap-2">
            {/* Show processing indicator only if not recording voice (which has its own indicator) */}
            {isLoading && !isRecording && ( 
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-xl">
                <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
                <span className="text-sm text-orange-700 font-medium">
                  {t('dayView.processing')}
                </span>
              </div>
            )}
            
            {/* 模板按钮 */}
            <Popover open={showTemplates} onOpenChange={setShowTemplates}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center"
                  title={t('taskInput.templates')}
                >
                  <LayoutTemplate className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <TaskTemplates onSelectTemplate={handleTemplateSelect} />
              </PopoverContent>
            </Popover>

            {/* 语音输入按钮 - now uses the helper function */}
            {recognition && getVoiceButton()}
            
            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 智能提示 */}
        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500">
            {t('dayView.smartInputHint')}
          </p>
        </div>
      </motion.form>
    </div>
  );
}
