import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PenTool, Save, X, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./i18n/LanguageContext";
import { format } from "date-fns";

export default function ReflectionEditor({ date, existingReflection, onSave, onCancel }) {
  const { t } = useLanguage();
  const [reflection, setReflection] = useState({
    date: date,
    content: "",
    mood: "normal",
    key_insights: [],
    tomorrow_plan: "",
    tags: []
  });
  const [newTag, setNewTag] = useState("");
  const [newInsight, setNewInsight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  useEffect(() => {
    if (existingReflection) {
      setReflection(existingReflection);
      // 如果已有额外数据，则默认展开
      if (existingReflection.mood !== 'normal' || existingReflection.key_insights?.length > 0 || existingReflection.tomorrow_plan || existingReflection.tags?.length > 0) {
        setShowOptional(true);
      }
    } else {
      setReflection(prev => ({ ...prev, date }));
    }
  }, [existingReflection, date]);

  const moodOptions = [
    { value: "excellent", label: t('reflection.mood.excellent'), color: "bg-green-500" },
    { value: "good", label: t('reflection.mood.good'), color: "bg-blue-500" },
    { value: "normal", label: t('reflection.mood.normal'), color: "bg-gray-500" },
    { value: "challenging", label: t('reflection.mood.challenging'), color: "bg-yellow-500" },
    { value: "difficult", label: t('reflection.mood.difficult'), color: "bg-red-500" }
  ];

  const addTag = () => {
    if (newTag.trim() && !(reflection.tags || []).includes(newTag.trim())) {
      setReflection(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setReflection(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const addInsight = () => {
    if (newInsight.trim()) {
      setReflection(prev => ({
        ...prev,
        key_insights: [...(prev.key_insights || []), newInsight.trim()]
      }));
      setNewInsight("");
    }
  };

  const removeInsight = (index) => {
    setReflection(prev => ({
      ...prev,
      key_insights: (prev.key_insights || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!reflection.content.trim()) return;

    setIsSaving(true);
    try {
      await onSave(reflection);
    } catch (error) {
      console.error("保存复盘失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-orange-600" />
            {existingReflection ? t('reflection.editTitle') : t('reflection.writeTitle')}
            <span className="text-sm font-normal text-gray-500">
              {format(new Date(date), 'yyyy-MM-dd')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 复盘内容 - Main focus */}
          <div>
            <h4 className="font-medium mb-3">{t('reflection.mainContent')} <span className="text-red-500">*</span></h4>
            <Textarea
              value={reflection.content}
              onChange={(e) => setReflection(prev => ({...prev, content: e.target.value}))}
              placeholder={t('reflection.contentPlaceholder')}
              rows={8}
              className="resize-y"
            />
             <p className="text-xs text-slate-500 mt-2">{t('reflection.contentHint')}</p>
          </div>

          {/* Optional Details Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <button 
              onClick={() => setShowOptional(!showOptional)} 
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-base font-semibold text-slate-700">{t('reflection.optionalDetails')}</h3>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showOptional && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* 心情选择 */}
                    <div>
                      <h4 className="font-medium mb-3">{t('reflection.todayMood')}</h4>
                      <Select value={reflection.mood} onValueChange={(value) => setReflection(prev => ({...prev, mood: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moodOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 标签 */}
                    <div>
                      <h4 className="font-medium mb-3">{t('reflection.tags')}</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(reflection.tags || []).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder={t('reflection.addTagPlaceholder')}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button onClick={addTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6">
                    {/* 关键洞察 */}
                    <div>
                      <h4 className="font-medium mb-3">{t('reflection.keyInsights')}</h4>
                      <div className="space-y-2">
                        {(reflection.key_insights || []).map((insight, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                            <span className="flex-1 text-sm">{insight}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInsight(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newInsight}
                            onChange={(e) => setNewInsight(e.target.value)}
                            placeholder={t('reflection.addInsightPlaceholder')}
                            onKeyPress={(e) => e.key === 'Enter' && addInsight()}
                          />
                          <Button onClick={addInsight} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 明日计划 */}
                    <div>
                      <h4 className="font-medium mb-3">{t('reflection.tomorrowPlan')}</h4>
                      <Textarea
                        value={reflection.tomorrow_plan}
                        onChange={(e) => setReflection(prev => ({...prev, tomorrow_plan: e.target.value}))}
                        placeholder={t('reflection.tomorrowPlanPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <Button
              onClick={handleSave}
              disabled={!reflection.content.trim() || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}