import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "./i18n/LanguageContext";

export default function FeedbackModal({ isOpen, onClose, onSubmit, insightType, insightId }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [improvementAreas, setImprovementAreas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const improvementOptions = [
    { key: "accuracy", label: t('feedback.accuracy') },
    { key: "relevance", label: t('feedback.relevance') },  
    { key: "actionability", label: t('feedback.actionability') },
    { key: "clarity", label: t('feedback.clarity') },
    { key: "completeness", label: t('feedback.completeness') }
  ];

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        insight_id: insightId,
        insight_type: insightType,
        date: new Date().toISOString().split('T')[0],
        helpfulness_rating: rating,
        feedback_text: feedbackText,
        improvement_areas: improvementAreas
      });
      
      // 重置表单
      setRating(0);
      setFeedbackText("");
      setImprovementAreas([]);
      onClose();
    } catch (error) {
      console.error("提交反馈失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleImprovementArea = (area) => {
    setImprovementAreas(prev => 
      prev.includes(area) 
        ? prev.filter(item => item !== area)
        : [...prev, area]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('feedback.title')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 评分 */}
            <div>
              <h4 className="font-medium mb-3">{t('feedback.howHelpful')}</h4>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      star <= rating 
                        ? "bg-orange-500 text-white" 
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* 改进方面 */}
            {rating < 4 && (
              <div>
                <h4 className="font-medium mb-3">{t('feedback.whatCanImprove')}</h4>
                <div className="flex flex-wrap gap-2">
                  {improvementOptions.map((option) => (
                    <Badge
                      key={option.key}
                      variant={improvementAreas.includes(option.key) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleImprovementArea(option.key)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 文字反馈 */}
            <div>
              <h4 className="font-medium mb-3">{t('feedback.additionalComments')} {t('common.optional')}</h4>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t('feedback.commentsPlaceholder')}
                rows={3}
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('common.submitting') : t('feedback.submit')}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}