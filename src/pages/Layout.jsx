

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Brain, BarChart3, Calendar, Settings, History } from "lucide-react"; // Added History icon
import { LanguageProvider, useLanguage } from "./components/i18n/LanguageContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <style jsx>{`
          :root {
            --primary: #1e293b;
            --primary-light: #334155;
            --accent: #f97316;
            --accent-light: #fb923c;
            --surface: #ffffff;
            --background: #f8fafc;
          }
          
          /* iPhone 风格开关样式 */
          [data-state="checked"] {
            background-color: #34d399 !important;
          }
          
          [data-state="unchecked"] {
            background-color: #e2e8f0 !important;
          }
          
          [data-state="checked"]:hover {
            background-color: #10b981 !important;
          }
          
          [data-state="unchecked"]:hover {
            background-color: #cbd5e1 !important;
          }
          
          /* 开关按钮的过渡效果 */
          button[role="switch"] {
            transition: background-color 0.2s ease-in-out !important;
          }
          
          /* 开关内部圆点的样式 */
          button[role="switch"] > span {
            background-color: white !important;
            transition: transform 0.2s ease-in-out !important;
          }
        `}</style>

        <LayoutContent currentPageName={currentPageName}>
          {children}
        </LayoutContent>
      </div>
    </LanguageProvider>
  );
}

function LayoutContent({ children, currentPageName }) {
  // 这里需要用到 useLanguage，所以放在 LanguageProvider 内部
  return (
    <>
      {/* 顶部导航 - 所有页面都显示 */}
      <HeaderNavigation currentPageName={currentPageName} />

      {/* 主要内容 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 浮动按钮 - 仅在主页面显示 */}
      {currentPageName === "DayView" && <FloatingButtons />}
    </>
  );
}

function HeaderNavigation({ currentPageName }) {
  const { t } = useLanguage();
  
  if (currentPageName === "DayView") {
    // 首页显示功能快捷导航
    return (
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800">AuraFlow</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                to={createPageUrl("Analytics")} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navigation.analytics')}</span>
              </Link>
              
              <Link 
                to={createPageUrl("Insights")} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navigation.insights')}</span>
              </Link>
              
              <Link 
                to={createPageUrl("Settings")} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t('navigation.settings')}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 其他页面显示返回导航
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            to={createPageUrl("DayView")} 
            className="flex items-center gap-2 text-slate-800 hover:text-slate-600 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{t('navigation.backToToday')}</span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {currentPageName === "Insights" ? t('navigation.insights') : 
               currentPageName === "Analytics" ? t('navigation.analytics') : 
               currentPageName === "ReflectionHistory" ? t('reflection.historyTitle') :
               t('navigation.settings')}
            </h1>
            {currentPageName === "Insights" && (
              <Link 
                to={createPageUrl("ReflectionHistory")} 
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{t('reflection.historyTitle')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function FloatingButtons() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3">
      <Link to={createPageUrl("Settings")}>
        <button className="w-12 h-12 bg-slate-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </button>
      </Link>
      <Link to={createPageUrl("Analytics")}>
        <button className="w-14 h-14 bg-slate-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <BarChart3 className="w-6 h-6" />
        </button>
      </Link>
      <Link to={createPageUrl("Insights")}>
        <button className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <Brain className="w-7 h-7" />
        </button>
      </Link>
    </div>
  );
}

