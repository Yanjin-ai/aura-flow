
// AI 功能开关与配置 - 默认全关
// BEGIN: AI flags for mock E2E
export const AI_ENABLED = true;           // 仅在我们自测时开启
export const AI_CLASSIFY_ENABLED = true;  // 阶段三可见
export const AI_DAILY_ENABLED = true;     // 阶段四可见
export const AI_WEEKLY_ENABLED = true;
export const AI_EXTRACT_ENABLED = true;   // URL提取功能开关

export const PROVIDER_MODE = "mock";      // mock → (后续) dry-run → live
// END

// 置信度与质量控制
export const LOW_CONFIDENCE_THRESHOLD = 0.55;

// 批处理配置
export const BATCH_CLASSIFY_INTERVAL_MS = 15000; // 15秒
export const BATCH_CLASSIFY_MAX_ITEMS = 50;

// 内容长度限制
export const DAILY_CHAR_MIN = 300;
export const DAILY_CHAR_MAX = 500;
export const WEEKLY_CHAR_MIN = 500;
export const WEEKLY_CHAR_MAX = 800;

// 用户限流配置
export const PER_USER_CLASSIFY_LIMIT = 100;  // 每日分类次数
export const PER_USER_DAILY_LIMIT = 2;       // 每日洞察次数
export const PER_USER_WEEKLY_LIMIT = 2;      // 每周洞察次数
export const PER_USER_EXTRACT_LIMIT = 50;    // 每日URL提取次数

// 全局限流配置
export const GLOBAL_QPS_LIMIT = 30; // 每分钟最大调用次数

// 任务延期配置
export const DEFAULT_ROLLOVER_DAYS = 3;     // 默认检查延期天数
export const MAX_ROLLOVER_DAYS = 14;        // 最大延期检查天数
