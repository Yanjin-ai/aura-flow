// 任务分类队列 - 批处理与异步回写
import { BATCH_CLASSIFY_INTERVAL_MS, BATCH_CLASSIFY_MAX_ITEMS, AI_ENABLED, AI_CLASSIFY_ENABLED } from './flags';
import { classifyTask } from './service';

// 队列和回调管理
let classificationQueue = [];
let processingTimer = null;
let onTaskCategoryResolvedCallback = null;

/**
 * 设置任务分类完成回调
 * @param {Function} callback - 回调函数 (result: {taskId, result}) => void
 */
export function setOnTaskCategoryResolved(callback) {
  onTaskCategoryResolvedCallback = callback;
}

/**
 * 将任务加入分类队列
 * @param {Object} params - 队列参数
 * @param {string} params.taskId - 任务ID
 * @param {string} params.text - 任务文本
 * @param {string} params.locale - 语言环境
 */
export function enqueueTaskForClassification({ taskId, text, locale = "zh-CN" }) {
  // 检查AI功能是否启用
  if (!AI_ENABLED || !AI_CLASSIFY_ENABLED) {
    if (import.meta.env.DEV) console.log("AI classification is disabled, skipping task:", taskId);
    return;
  }

  // 检查是否已在队列中
  if (classificationQueue.some(item => item.taskId === taskId)) {
    if (import.meta.env.DEV) console.log("Task already in classification queue:", taskId);
    return;
  }

  // 添加到队列
  const queueItem = {
    taskId,
    text,
    locale,
    timestamp: Date.now(),
    retryCount: 0
  };
  
  classificationQueue.push(queueItem);
if (import.meta.env.DEV) console.log(`Task ${taskId} added to classification queue. Queue size: ${classificationQueue.length}`);
  
  // 启动或重置处理定时器
  scheduleQueueProcessing();
}

/**
 * 调度队列处理
 */
function scheduleQueueProcessing() {
  // 如果队列达到批处理上限，立即处理
  if (classificationQueue.length >= BATCH_CLASSIFY_MAX_ITEMS) {
    processQueue();
    return;
  }
  
  // 如果已有定时器在运行，不重复设置
  if (processingTimer) {
    return;
  }
  
  // 设置定时器
  processingTimer = setTimeout(() => {
    processQueue();
  }, BATCH_CLASSIFY_INTERVAL_MS);
}

/**
 * 处理队列中的任务
 */
async function processQueue() {
  // 清除定时器
  if (processingTimer) {
    clearTimeout(processingTimer);
    processingTimer = null;
  }
  
  if (classificationQueue.length === 0) {
    return;
  }
  
if (import.meta.env.DEV) console.log(`Processing ${classificationQueue.length} tasks in classification queue`);
  
  // 取出当前队列中的所有任务
  const tasksToProcess = [...classificationQueue];
  classificationQueue = [];
  
  // 并发处理任务（但限制并发数）
  const concurrency = Math.min(5, tasksToProcess.length);
  const batches = [];
  
  for (let i = 0; i < tasksToProcess.length; i += concurrency) {
    batches.push(tasksToProcess.slice(i, i + concurrency));
  }
  
  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(async (queueItem) => {
        try {
          if (import.meta.env.DEV) console.log(`Classifying task ${queueItem.taskId}: "${queueItem.text.substring(0, 50)}..."`);
          
          const result = await classifyTask({
            text: queueItem.text,
            locale: queueItem.locale
          });
          
          if (import.meta.env.DEV) console.log(`Task ${queueItem.taskId} classified as: ${result.category} (confidence: ${result.confidence})`);
          
          // 调用回调函数
          if (onTaskCategoryResolvedCallback) {
            onTaskCategoryResolvedCallback({
              taskId: queueItem.taskId,
              result
            });
          } else {
            console.warn("No callback set for task classification results");
          }
          
        } catch (error) {
          console.error(`Failed to classify task ${queueItem.taskId}:`, error);
          
          // 重试逻辑
          if (queueItem.retryCount < 1) {
            queueItem.retryCount++;
            classificationQueue.push(queueItem);
            if (import.meta.env.DEV) console.log(`Task ${queueItem.taskId} queued for retry (attempt ${queueItem.retryCount + 1})`);
          } else {
            console.error(`Task ${queueItem.taskId} failed after all retries`);
            
            // 最终失败，回调默认分类
            if (onTaskCategoryResolvedCallback) {
              onTaskCategoryResolvedCallback({
                taskId: queueItem.taskId,
                result: {
                  category: "其他",
                  confidence: 0.3,
                  secondary: null,
                  source: "mock",
                  prompt_version: "task-classify-v1",
                  ai_updated_at: Date.now()
                }
              });
            }
          }
        }
      })
    );
  }
  
  // 如果还有重试的任务，继续调度
  if (classificationQueue.length > 0) {
    scheduleQueueProcessing();
  }
}

/**
 * 获取队列状态（用于调试）
 */
export function getQueueStatus() {
  return {
    queueSize: classificationQueue.length,
    hasTimer: !!processingTimer,
    hasCallback: !!onTaskCategoryResolvedCallback
  };
}

/**
 * 清空队列（用于测试或重置）
 */
export function clearQueue() {
  classificationQueue = [];
  if (processingTimer) {
    clearTimeout(processingTimer);
    processingTimer = null;
  }
if (import.meta.env.DEV) console.log("Classification queue cleared");
}