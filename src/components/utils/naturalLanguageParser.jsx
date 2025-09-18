import { format, addDays, parse, isValid } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 自然语言解析器 - 从用户输入中提取任务信息
 * @param {string} input - 用户输入的文本
 * @returns {Object} 解析后的任务对象
 */
export function parseNaturalLanguage(input) {
  const result = {
    content: input,
    date: format(new Date(), 'yyyy-MM-dd'),
    category: null,
    priority: 'medium',
    due_time: null,
    tags: []
  };

  // 提取标签 (#标签)
  const tagMatches = input.match(/#(\S+)/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1));
    // 移除标签，保持干净的任务内容
    result.content = input.replace(/#\S+/g, '').trim();
  }

  // 提取优先级标记 (!高 !重要 !urgent)
  const priorityPatterns = {
    high: [/!高/g, /!重要/g, /!紧急/g, /!urgent/gi, /!high/gi, /!/g],
    low: [/!低/g, /!不急/g, /!low/gi]
  };
  
  for (const [priority, patterns] of Object.entries(priorityPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        result.priority = priority;
        result.content = result.content.replace(pattern, '').trim();
        break;
      }
    }
    if (result.priority !== 'medium') break;
  }

  // 提取时间信息
  const timeInfo = extractTimeInfo(input);
  if (timeInfo.date) {
    result.date = timeInfo.date;
    result.content = timeInfo.cleanedContent || result.content;
  }
  if (timeInfo.time) {
    result.due_time = timeInfo.time;
  }

  // 自动分类
  result.category = autoCategorizeByChinese(result.content);

  return result;
}

/**
 * 提取时间信息
 * @param {string} input - 输入文本
 * @returns {Object} 包含日期、时间和清理后内容的对象
 */
function extractTimeInfo(input) {
  const result = {
    date: null,
    time: null,
    cleanedContent: input
  };

  const today = new Date();
  
  // 相对日期模式
  const relativeDatePatterns = [
    { pattern: /今天|今日/g, days: 0 },
    { pattern: /明天|明日/g, days: 1 },
    { pattern: /后天/g, days: 2 },
    { pattern: /大后天/g, days: 3 },
    { pattern: /下周一/g, days: getDaysUntilWeekday(today, 1) },
    { pattern: /下周二/g, days: getDaysUntilWeekday(today, 2) },
    { pattern: /下周三/g, days: getDaysUntilWeekday(today, 3) },
    { pattern: /下周四/g, days: getDaysUntilWeekday(today, 4) },
    { pattern: /下周五/g, days: getDaysUntilWeekday(today, 5) },
  ];

  for (const { pattern, days } of relativeDatePatterns) {
    if (pattern.test(input)) {
      result.date = format(addDays(today, days), 'yyyy-MM-dd');
      result.cleanedContent = input.replace(pattern, '').trim();
      break;
    }
  }

  // 绝对日期模式 (12月25日, 12/25, 2024-12-25)
  const absoluteDatePatterns = [
    /(\d{1,2})月(\d{1,2})日?/,
    /(\d{1,2})\/(\d{1,2})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];

  for (const pattern of absoluteDatePatterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        let targetDate;
        if (pattern.source.includes('yyyy')) {
          // 完整日期格式
          targetDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          // 月日格式，使用当前年份
          const month = parseInt(match[1]) - 1;
          const day = parseInt(match[2]);
          targetDate = new Date(today.getFullYear(), month, day);
          
          // 如果日期已过，使用明年
          if (targetDate < today) {
            targetDate.setFullYear(today.getFullYear() + 1);
          }
        }
        
        if (isValid(targetDate)) {
          result.date = format(targetDate, 'yyyy-MM-dd');
          result.cleanedContent = input.replace(match[0], '').trim();
          break;
        }
      } catch (e) {
        console.warn('Date parsing error:', e);
      }
    }
  }

  // 时间模式 (下午3点, 15:30, 9am)
  const timePatterns = [
    /(\d{1,2}):(\d{2})/,
    /(\d{1,2})点(\d{1,2})?分?/,
    /下午(\d{1,2})点?/,
    /上午(\d{1,2})点?/,
    /(\d{1,2})(am|pm)/i
  ];

  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        let hour = parseInt(match[1]);
        let minute = parseInt(match[2]) || 0;
        
        // 处理上午/下午
        if (input.includes('下午') && hour < 12) {
          hour += 12;
        } else if (match[2] && match[2].toLowerCase() === 'pm' && hour < 12) {
          hour += 12;
        }
        
        result.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        result.cleanedContent = result.cleanedContent.replace(match[0], '').replace(/上午|下午/g, '').trim();
        break;
      } catch (e) {
        console.warn('Time parsing error:', e);
      }
    }
  }

  return result;
}

/**
 * 获取到指定星期几的天数
 */
function getDaysUntilWeekday(fromDate, targetWeekday) {
  const currentWeekday = fromDate.getDay() || 7; // 周日为7
  const daysInWeek = 7;
  return (targetWeekday + daysInWeek - currentWeekday) % daysInWeek + 7; // 下周
}

/**
 * 基于中文关键词的自动分类
 */
function autoCategorizeByChinese(content) {
  const categories = {
    '工作': ['会议', '报告', '项目', '客户', '邮件', '汇报', '方案', '需求', '开发', '测试', '上线', '发布'],
    '学习': ['阅读', '看书', '学习', '课程', '教程', '练习', '复习', '考试', '培训', '研究', '论文'],
    '生活': ['购物', '买', '超市', '菜市场', '洗衣', '打扫', '整理', '缴费', '水电费', '房租', '维修', '搬家'],
    '健康': ['运动', '跑步', '健身', '瑜伽', '散步', '游泳', '体检', '看医生', '吃药', '锻炼', '减肥'],
    '娱乐': ['电影', '看剧', '游戏', '聚会', '旅行', '音乐', '演唱会', '展览', '朋友', '约会', '休息']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }

  return '其他';
}