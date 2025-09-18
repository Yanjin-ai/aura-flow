
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "./i18n/LanguageContext";

export default function DateNavigator({ currentDate, onDateChange }) {
  const { t, language } = useLanguage();
  const [showCalendar, setShowCalendar] = useState(false);

  const goToPrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getDateFormat = () => {
    if (language === 'en-US') {
      return isToday(currentDate) ? "Today's Tasks" : format(currentDate, "MMM dd");
    } else {
      return isToday(currentDate) ? "今日待办" : format(currentDate, "MM月dd日", { locale: zhCN });
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <motion.h1
        key={currentDate.toISOString()}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-3xl font-bold text-slate-800"
      >
        {isToday(currentDate) ? (
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {t('dayView.todayTasks')}
          </span>
        ) : (
          getDateFormat()
        )}
      </motion.h1>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevDay}
          className="rounded-xl border-slate-200 hover:border-orange-300 hover:bg-orange-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 hover:border-orange-300 hover:bg-orange-50 gap-2"
            >
              <Calendar className="w-4 h-4" />
              {format(currentDate, language === 'en-US' ? "yyyy/MM/dd" : "yyyy/MM/dd")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setShowCalendar(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextDay}
          className="rounded-xl border-slate-200 hover:border-orange-300 hover:bg-orange-50"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {!isToday(currentDate) && (
          <Button
            onClick={goToToday}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg transition-all duration-300"
          >
            {language === 'en-US' ? 'Today' : '回到今日'}
          </Button>
        )}
      </div>
    </div>
  );
}
