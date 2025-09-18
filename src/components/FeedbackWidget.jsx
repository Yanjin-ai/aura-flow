import React, { useState } from 'react';
import { InsightFeedback } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

export default function FeedbackWidget({ insightId, insightType }) {
  const { t } = useLanguage();
  const [feedbackState, setFeedbackState] = useState('idle'); // idle -> rating -> submitted
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (selectedRating) => {
    setRating(selectedRating);
    setFeedbackState('rating');
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await InsightFeedback.create({
        insight_id: insightId,
        insight_type: insightType,
        date: new Date().toISOString().split('T')[0],
        helpfulness_rating: rating === 'helpful' ? 5 : rating === 'somewhat_helpful' ? 3 : 1,
        feedback_text: comment
      });
      setFeedbackState('submitted');
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setFeedbackState('rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackState === 'submitted') {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
        <CheckCircle className="w-5 h-5" />
        <p className="font-medium text-sm">{t('feedback.thanks')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-200 mt-4 space-y-3">
      <h4 className="text-sm font-medium text-slate-700 text-center">{t('feedback.howHelpful')}</h4>
      {feedbackState === 'idle' && (
        <div className="flex justify-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRating('helpful')} 
            className="gap-2 hover:bg-green-50 hover:border-green-400"
          >
            <ThumbsUp className="w-4 h-4 text-green-600" /> 
            {t('feedback.helpful')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleRating('not_helpful')} 
            className="gap-2 hover:bg-red-50 hover:border-red-400"
          >
            <ThumbsDown className="w-4 h-4 text-red-600" /> 
            {t('feedback.notHelpful')}
          </Button>
        </div>
      )}
      {feedbackState === 'rating' && (
        <div className="space-y-3 animate-in fade-in">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('feedback.additionalComments')}
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="gap-2">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t('common.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('feedback.submit')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}