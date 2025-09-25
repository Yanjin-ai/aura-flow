/**
 * 特性开关 Hook
 * 支持环境与 allowList 判定
 */

import { useState, useEffect } from 'react';
import featureFlags from '../config/feature-flags.json';

// 特性开关配置类型
interface FeatureFlagConfig {
  staging: boolean;
  prod: boolean;
  allowList: string[];
  description: string;
}

// 特性开关映射类型
type FeatureFlags = Record<string, FeatureFlagConfig>;

// 获取当前环境
const getCurrentEnvironment = (): 'staging' | 'prod' => {
  const hostname = window.location.hostname;
  if (hostname.includes('staging') || hostname.includes('localhost')) {
    return 'staging';
  }
  return 'prod';
};

// 获取当前用户邮箱
const getCurrentUserEmail = (): string | null => {
  // 从 localStorage 或其他地方获取用户信息
  try {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.email || null;
    }
  } catch (error) {
    console.warn('无法获取用户信息:', error);
  }
  return null;
};

// 检查特性是否启用
const isFeatureEnabled = (
  flagName: string, 
  flags: FeatureFlags = featureFlags
): boolean => {
  const flag = flags[flagName];
  if (!flag) {
    console.warn(`特性开关 "${flagName}" 不存在`);
    return false;
  }

  const environment = getCurrentEnvironment();
  const userEmail = getCurrentUserEmail();

  // 检查环境级别启用
  const environmentEnabled = flag[environment];
  
  // 检查用户白名单
  const inAllowList = userEmail && flag.allowList.includes(userEmail);
  
  // 特性启用条件：环境启用 OR 用户在白名单中
  return environmentEnabled || inAllowList;
};

// 获取特性开关信息
const getFeatureFlagInfo = (flagName: string) => {
  const flag = featureFlags[flagName];
  if (!flag) {
    return null;
  }

  const environment = getCurrentEnvironment();
  const userEmail = getCurrentUserEmail();
  
  return {
    name: flagName,
    description: flag.description,
    environment,
    environmentEnabled: flag[environment],
    inAllowList: userEmail ? flag.allowList.includes(userEmail) : false,
    allowList: flag.allowList,
    isEnabled: isFeatureEnabled(flagName)
  };
};

// 获取所有特性开关状态
const getAllFeatureFlags = (): Record<string, boolean> => {
  const flags: Record<string, boolean> = {};
  Object.keys(featureFlags).forEach(flagName => {
    flags[flagName] = isFeatureEnabled(flagName);
  });
  return flags;
};

// 获取所有特性开关详细信息
const getAllFeatureFlagInfo = () => {
  const flags: Record<string, any> = {};
  Object.keys(featureFlags).forEach(flagName => {
    flags[flagName] = getFeatureFlagInfo(flagName);
  });
  return flags;
};

/**
 * 特性开关 Hook
 * @param flagName 特性开关名称
 * @returns 特性是否启用
 */
export const useFeatureFlag = (flagName: string): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => 
    isFeatureEnabled(flagName)
  );

  useEffect(() => {
    // 监听用户信息变化
    const handleStorageChange = () => {
      setIsEnabled(isFeatureEnabled(flagName));
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查（用于动态更新）
    const interval = setInterval(() => {
      setIsEnabled(isFeatureEnabled(flagName));
    }, 30000); // 30秒检查一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [flagName]);

  return isEnabled;
};

/**
 * 特性开关信息 Hook
 * @param flagName 特性开关名称
 * @returns 特性开关详细信息
 */
export const useFeatureFlagInfo = (flagName: string) => {
  const [flagInfo, setFlagInfo] = useState(() => 
    getFeatureFlagInfo(flagName)
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setFlagInfo(getFeatureFlagInfo(flagName));
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      setFlagInfo(getFeatureFlagInfo(flagName));
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [flagName]);

  return flagInfo;
};

/**
 * 所有特性开关 Hook
 * @returns 所有特性开关状态
 */
export const useAllFeatureFlags = (): Record<string, boolean> => {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => 
    getAllFeatureFlags()
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setFlags(getAllFeatureFlags());
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      setFlags(getAllFeatureFlags());
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return flags;
};

/**
 * 所有特性开关信息 Hook
 * @returns 所有特性开关详细信息
 */
export const useAllFeatureFlagInfo = () => {
  const [flagInfo, setFlagInfo] = useState(() => 
    getAllFeatureFlagInfo()
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setFlagInfo(getAllFeatureFlagInfo());
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      setFlagInfo(getAllFeatureFlagInfo());
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return flagInfo;
};

// 导出工具函数
export {
  isFeatureEnabled,
  getFeatureFlagInfo,
  getAllFeatureFlags,
  getAllFeatureFlagInfo,
  getCurrentEnvironment,
  getCurrentUserEmail
};
