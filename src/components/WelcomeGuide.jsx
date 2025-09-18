import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Lightbulb, BrainCircuit, PenSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './i18n/LanguageContext';

export default function WelcomeGuide({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const guideSteps = [
    {
      icon: <Lightbulb className="w-12 h-12 text-orange-500" />,
      title: t('welcomeGuide.feature1Title'),
      description: t('welcomeGuide.feature1Desc'),
    },
    {
      icon: <BrainCircuit className="w-12 h-12 text-blue-500" />,
      title: t('welcomeGuide.feature2Title'),
      description: t('welcomeGuide.feature2Desc'),
    },
    {
      icon: <PenSquare className="w-12 h-12 text-purple-500" />,
      title: t('welcomeGuide.feature3Title'),
      description: t('welcomeGuide.feature3Desc'),
    },
  ];

  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, guideSteps.length - 1));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-8 text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t('welcomeGuide.title')}</DialogTitle>
          <DialogDescription>{t('welcomeGuide.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="h-64 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex justify-center">{guideSteps[step].icon}</div>
              <h3 className="text-xl font-semibold text-slate-800">{guideSteps[step].title}</h3>
              <p className="text-slate-600 px-4">{guideSteps[step].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 my-4">
          {guideSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === step ? 'bg-orange-500 scale-125' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0} className="sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('welcomeGuide.back')}
          </Button>

          {step < guideSteps.length - 1 ? (
            <Button onClick={handleNext} className="sm:w-auto">
              {t('welcomeGuide.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 sm:w-auto">
              {t('welcomeGuide.getStarted')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}