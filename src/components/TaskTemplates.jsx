import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Briefcase, GraduationCap, Heart, Home } from "lucide-react";
import { useLanguage } from "./i18n/LanguageContext";

export default function TaskTemplates({ onSelectTemplate }) {
  const [favorites, setFavorites] = useState(['daily-review', 'exercise']);
  const { t } = useLanguage();

  const getTemplates = () => [
    {
      id: 'daily-review',
      name: t('templates.dailyReview.name'),
      content: t('templates.dailyReview.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Work' : '工作',
      icon: Star,
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'meeting-prep',
      name: t('templates.meetingPrep.name'),
      content: t('templates.meetingPrep.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Work' : '工作', 
      icon: Briefcase,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'weekly-shopping',
      name: t('templates.weeklyShopping.name'),
      content: t('templates.weeklyShopping.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Life' : '生活',
      icon: Home,
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'exercise',
      name: t('templates.exercise.name'),
      content: t('templates.exercise.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Health' : '健康',
      icon: Heart,
      color: 'bg-red-100 text-red-700'
    },
    {
      id: 'study-session',
      name: t('templates.studySession.name'),
      content: t('templates.studySession.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Study' : '学习',
      icon: GraduationCap,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'call-family',
      name: t('templates.callFamily.name'),
      content: t('templates.callFamily.content'),
      category: t('analytics.categoryDistribution') === 'Category Distribution' ? 'Life' : '生活',
      icon: Heart,
      color: 'bg-pink-100 text-pink-700'
    }
  ];

  const toggleFavorite = (templateId) => {
    setFavorites(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const templates = getTemplates();
  const favoriteTemplates = templates.filter(t => favorites.includes(t.id));
  const otherTemplates = templates.filter(t => !favorites.includes(t.id));

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">{t('taskInput.quickTemplates')}</h3>
        <p className="text-sm text-slate-500 mt-1">{t('taskInput.templateHint')}</p>
      </div>

      <div className="p-2">
        {/* 收藏的模板 */}
        {favoriteTemplates.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('taskInput.favorites')}
            </div>
            <div className="grid gap-2 mb-4">
              {favoriteTemplates.map(template => (
                <TemplateItem 
                  key={template.id}
                  template={template}
                  isFavorite={true}
                  onSelect={onSelectTemplate}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </>
        )}

        {/* 其他模板 */}
        {otherTemplates.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('taskInput.allTemplates')}
            </div>
            <div className="grid gap-2">
              {otherTemplates.map(template => (
                <TemplateItem 
                  key={template.id}
                  template={template}
                  isFavorite={false}
                  onSelect={onSelectTemplate}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TemplateItem({ template, isFavorite, onSelect, onToggleFavorite }) {
  const IconComponent = template.icon;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 group">
      <div className={`w-8 h-8 rounded-lg ${template.color} flex items-center justify-center flex-shrink-0`}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-slate-800 text-sm">{template.name}</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(template.id);
            }}
            className={`p-1 rounded ${isFavorite ? 'text-orange-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'} hover:text-orange-500 transition-all`}
          >
            <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-slate-500 truncate">{template.content}</p>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect(template)}
        className="opacity-0 group-hover:opacity-100 p-1 h-auto"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}