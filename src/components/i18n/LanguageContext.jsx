import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('zh-CN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
    try {
      const user = await User.me();
      const userLang = user.language || 'zh-CN';
      setLanguage(userLang);
    } catch (error) {
      console.error('Failed to load user language:', error);
      // 如果获取失败，检查浏览器语言
      const browserLang = navigator.language;
      if (browserLang.startsWith('en')) {
        setLanguage('en-US');
      } else {
        setLanguage('zh-CN');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await User.updateMyUserData({ language: newLanguage });
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 返回原键名作为fallback
      }
    }
    
    if (typeof value === 'string') {
      // 简单的参数替换
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};