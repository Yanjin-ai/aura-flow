import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// 获取环境变量中的 App ID（开发模式允许为空，避免阻塞本地调试）
const appId = import.meta.env.VITE_APP_ID;

// 生产环境强校验，开发环境放宽（不抛错，避免白屏）
if (!appId && import.meta.env.PROD) {
  throw new Error(
    'VITE_APP_ID 环境变量未设置。请创建 .env.local 文件并设置 VITE_APP_ID=your_app_id'
  );
}

// 开发模式：创建模拟客户端，避免真实 API 调用
let base44;
if (import.meta.env.DEV) {
  // 开发模式：创建模拟客户端
  base44 = {
    entities: {
      Task: {
        filter: async () => [],
        create: async () => ({ id: 'mock-task-id' }),
        update: async () => ({ id: 'mock-task-id' }),
        delete: async () => true
      },
      Insight: {
        filter: async () => [],
        create: async () => ({ id: 'mock-insight-id' })
      },
      Reflection: {
        filter: async () => [],
        create: async () => ({ id: 'mock-reflection-id' })
      },
      InsightFeedback: {
        create: async () => ({ id: 'mock-feedback-id' })
      }
    },
    auth: {
      me: async () => ({ 
        id: 'mock-user-id',
        has_seen_welcome_guide: true,
        language: 'zh-CN',
        auto_rollover_enabled: true,
        auto_rollover_days: 3,
        rollover_notification_enabled: true,
        ai_daily_insights: true,
        ai_weekly_insights: true,
        ai_url_extraction: true
      }),
      updateMyUserData: async () => ({ id: 'mock-user-id' })
    },
    integrations: {
      Core: {
        InvokeLLM: async () => ({ mock: true }),
        SendEmail: async () => ({ mock: true }),
        UploadFile: async () => ({ mock: true }),
        GenerateImage: async () => ({ mock: true }),
        ExtractDataFromUploadedFile: async () => ({ mock: true }),
        CreateFileSignedUrl: async () => ({ mock: true }),
        UploadPrivateFile: async () => ({ mock: true })
      }
    }
  };
} else {
  // 生产环境：使用真实客户端
  base44 = createClient({
    appId: appId,
    requiresAuth: true
  });
}

export { base44 };
