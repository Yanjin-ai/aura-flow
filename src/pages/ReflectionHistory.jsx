
import React, { useState, useEffect, useCallback } from "react";
import { Reflection } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Tag, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "../components/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReflectionHistory() {
  const { t } = useLanguage();
  const [reflections, setReflections] = useState([]);
  const [filteredReflections, setFilteredReflections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReflections = async () => {
    try {
      setIsLoading(true);
      const data = await Reflection.list('-created_date', 100);
      setReflections(data);
      
      // 提取所有标签
      const tags = new Set();
      data.forEach(reflection => {
        if (reflection.tags) {
          reflection.tags.forEach(tag => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error("加载复盘历史失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize filterReflections to stabilize its reference
  const filterReflections = useCallback(() => {
    let filtered = reflections;

    // 按关键词搜索
    if (searchQuery.trim()) {
      filtered = filtered.filter(reflection =>
        reflection.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.tomorrow_plan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.key_insights?.some(insight => 
          insight.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // 按标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter(reflection =>
        reflection.tags && selectedTags.every(tag => reflection.tags.includes(tag))
      );
    }

    setFilteredReflections(filtered);
  }, [reflections, searchQuery, selectedTags]); // Dependencies for useCallback

  useEffect(() => {
    loadReflections();
  }, []);

  // Now, this useEffect depends on the memoized filterReflections function
  useEffect(() => {
    filterReflections();
  }, [filterReflections]); // filterReflections changes only when its dependencies change

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getMoodColor = (mood) => {
    const colors = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      normal: "bg-gray-100 text-gray-800",
      challenging: "bg-yellow-100 text-yellow-800",
      difficult: "bg-red-100 text-red-800"
    };
    return colors[mood] || colors.normal;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to={createPageUrl("Insights")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('reflection.historyTitle')}</h1>
        <p className="text-slate-600">{t('reflection.historySubtitle')}</p>
      </motion.div>

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder={t('reflection.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {allTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">{t('reflection.filterByTags')}</h4>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 复盘列表 */}
      <div className="space-y-4">
        {filteredReflections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">
                {reflections.length === 0 ? t('reflection.noReflections') : t('reflection.noMatchingReflections')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReflections.map(reflection => (
            <motion.div
              key={reflection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">
                      {format(parseISO(reflection.date), 'yyyy年MM月dd日')}
                    </span>
                    <div className="flex items-center gap-2">
                      {reflection.mood && (
                        <Badge className={getMoodColor(reflection.mood)}>
                          {t(`reflection.mood.${reflection.mood}`)}
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="prose prose-slate max-w-none">
                      <p className="text-slate-700 line-clamp-3">{reflection.content}</p>
                    </div>
                    
                    {reflection.key_insights && reflection.key_insights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-1">{t('reflection.keyInsights')}</h4>
                        <ul className="text-sm text-slate-600 list-disc list-inside">
                          {reflection.key_insights.slice(0, 2).map((insight, i) => (
                            <li key={i} className="line-clamp-1">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {reflection.tags && reflection.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reflection.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
