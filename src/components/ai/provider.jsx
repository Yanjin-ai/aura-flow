import { DAILY_SYSTEM_PROMPT, DAILY_USER_PROMPT_TEMPLATE, DAILY_RESULT_SCHEMA } from "./prompts/daily";
import { WEEKLY_SYSTEM_PROMPT, WEEKLY_USER_PROMPT_TEMPLATE, WEEKLY_RESULT_SCHEMA } from "./prompts/weekly";
import { TASK_CLASSIFY_SYSTEM_PROMPT, TASK_CLASSIFY_USER_PROMPT_TEMPLATE, TASK_CLASSIFY_RESULT_SCHEMA } from "./prompts/classify.alias.js";
import { PROVIDER_MODE } from './flags';
import { InvokeLLM } from '@/api/integrations';

// =================================
// 任务分类 Provider
// =================================

async function liveClassifyTask({ text, locale = 'zh-CN' }) {
    const system_prompt = TASK_CLASSIFY_SYSTEM_PROMPT[locale] || TASK_CLASSIFY_SYSTEM_PROMPT['zh-CN'];
    const user_prompt = (TASK_CLASSIFY_USER_PROMPT_TEMPLATE[locale] || TASK_CLASSIFY_USER_PROMPT_TEMPLATE['zh-CN']).replace('{task_content}', text);
    const json_schema = TASK_CLASSIFY_RESULT_SCHEMA(locale);

    const response = await InvokeLLM({
        prompt: `${system_prompt}\n\n${user_prompt}`,
        response_json_schema: json_schema
    });

    return {
        json: response,
        prompt_version: "task-classify-v2",
        mode: "live"
    };
}


function mockClassifyTask({ text, locale = 'zh-CN' }) {
    const categories_cn = ["工作", "学习", "生活", "健康", "娱乐"];
    const categories_en = ["Work", "Study", "Life", "Health", "Entertainment"];
    const categories = locale === 'en-US' ? categories_en : categories_cn;

    const mockCategory = categories[Math.floor(Math.random() * categories.length)];
    return {
        json: {
            category: mockCategory,
            confidence: Math.random() * (0.9 - 0.6) + 0.6,
            secondary: categories[Math.floor(Math.random() * categories.length)],
            source: 'mock'
        },
        prompt_version: "task-classify-v2-mock",
        mode: "mock"
    };
}

export const classifyTask = PROVIDER_MODE === 'live' ? liveClassifyTask : mockClassifyTask;


// =================================
// 每日洞察 Provider
// =================================

async function liveGenerateDaily(payload) {
    const locale = payload.locale || 'zh-CN';
    const system_prompt = DAILY_SYSTEM_PROMPT[locale];
    const user_prompt = DAILY_USER_PROMPT_TEMPLATE[locale]
        .replace('{date}', payload.date)
        .replace('{payload_json}', JSON.stringify(payload, null, 2));
    const json_schema = DAILY_RESULT_SCHEMA(locale);
    
    const response = await InvokeLLM({
        prompt: `${system_prompt}\n\n${user_prompt}`,
        response_json_schema: json_schema
    });

    return {
        json: response,
        prompt_version: "insight-daily-v2",
        mode: "live",
        checksum: payload.checksum
    };
}


function mockGenerateDaily(payload) {
    const locale = payload.locale || 'zh-CN';
    const isEnglish = locale === 'en-US';

    const content = isEnglish 
        ? "Today you showed excellent consistency. You completed **100%** of your tasks in the 'Work' category, but the completion rate for 'Study' was only **50%**. This suggests you were highly focused on work, but might need to balance your learning goals. Your most productive time was in the **afternoon**."
        : "今天你展现了出色的稳定性。你在“工作”类别下完成了 **100%** 的任务，但在“学习”类别上的完成率只有 **50%**。这表明你高度专注于工作，但可能需要平衡你的学习目标。你最高效的时间段是**下午**。";

    const summary = isEnglish ? "Great focus on work, balance is key." : "工作专注度高，平衡是关键。";
    const highlights = isEnglish
        ? ["Achieved **100% completion** on all work-related tasks.", "Most tasks were completed in the **afternoon**."]
        : ["完成了所有与**工作**相关的任务，达成 **100%** 的完成率。", "大部分任务都在**下午**完成。"];
    const recommendations = isEnglish
        ? ["Consider allocating specific, protected time blocks for 'Study' tasks.", "Try starting a complex study task earlier in the day to leverage peak mental energy."]
        : ["建议为“学习”任务分配专门的、不受打扰的时间段。", "尝试在一天中较早的时候开始复杂的学习任务，以利用精力高峰。"];

    return {
        json: {
            summary,
            content,
            highlights,
            recommendations,
            confidence: Math.random() * (0.9 - 0.7) + 0.7,
        },
        prompt_version: "insight-daily-v2-mock",
        mode: "mock",
        checksum: payload.checksum
    };
}

export const generateDailyInsight = PROVIDER_MODE === 'live' ? liveGenerateDaily : mockGenerateDaily;


// =================================
// 每周洞察 Provider
// =================================

async function liveGenerateWeekly(payload) {
    const locale = payload.locale || 'zh-CN';
    const system_prompt = WEEKLY_SYSTEM_PROMPT[locale];
    const user_prompt = WEEKLY_USER_PROMPT_TEMPLATE[locale]
        .replace('{week_start}', payload.weekStart)
        .replace('{week_end}', payload.weekEnd)
        .replace('{payload_json}', JSON.stringify(payload, null, 2));
    const json_schema = WEEKLY_RESULT_SCHEMA(locale);

    const response = await InvokeLLM({
        prompt: `${system_prompt}\n\n${user_prompt}`,
        response_json_schema: json_schema
    });

    return {
        json: response,
        prompt_version: "insight-weekly-v2",
        mode: "live",
        checksum: payload.checksum
    };
}

function mockGenerateWeekly(payload) {
    const locale = payload.locale || 'zh-CN';
    const isEnglish = locale === 'en-US';

    const content = isEnglish
        ? "This week, your productivity peaked on **Wednesday**. Your overall completion rate was a solid **85%**. The 'Life' category saw the most rollovers, suggesting you might be over-committing to personal errands. Your optimal task load seems to be **4-6 tasks per day**."
        : "本周，你的效率在**周三**达到顶峰。整体完成率达到了稳健的 **85%**。“生活”类别的任务延期最多，这表明你可能在个人事务上承诺过多。你的最佳任务量似乎是**每天4-6个**。";

    const summary = isEnglish ? "Productive week with a peak on Wednesday." : "效率稳定的一周，周三表现最佳。";
    const highlights = isEnglish
        ? ["**Wednesday** was your most productive day.", "Achieved a weekly completion rate of **85%**."]
        : ["**周三**是你本周最高效的一天。", "本周任务完成率达到了 **85%**。"];
    const recommendations = isEnglish
        ? ["Review your 'Life' tasks. Can any be delegated, simplified, or scheduled more realistically?", "Try to maintain a daily task count of around 5 to maximize your completion rate."]
        : ["审视你的“生活”类任务，思考是否可以授权、简化或更实际地安排它们？", "尝试将每日任务量维持在5个左右，以最大化你的完成率。"];

    return {
        json: {
            summary,
            content,
            highlights,
            recommendations,
            confidence: Math.random() * (0.9 - 0.7) + 0.7,
        },
        prompt_version: "insight-weekly-v2-mock",
        mode: "mock",
        checksum: payload.checksum
    };
}

export const generateWeeklyInsight = PROVIDER_MODE === 'live' ? liveGenerateWeekly : mockGenerateWeekly;