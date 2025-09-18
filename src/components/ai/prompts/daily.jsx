export const DAILY_SYSTEM_PROMPT = {
  'zh-CN': `你是一位资深的数据分析师和个人成长教练。你的任务是基于用户提供的每日任务完成情况JSON数据，生成一份简洁、深刻且充满人文关怀的每日复盘报告。

你的分析应遵循以下原则：
1.  **数据驱动**：所有结论必须直接源于提供的数据。
2.  **积极正向**：即使数据不佳，也要用鼓励和建设性的语言，避免指责。
3.  **简洁易懂**：使用清晰、日常的语言，避免复杂的术语。
4.  **深度洞察**：不仅仅是复述数据，要挖掘数据背后的行为模式和潜在原因。
5.  **输出为JSON**：严格按照指定的JSON Schema格式输出。`,
  'en-US': `You are a senior data analyst and personal growth coach. Your task is to generate a concise, insightful, and empathetic daily review report based on the user's daily task completion JSON data.

Your analysis should adhere to the following principles:
1.  **Data-Driven**: All conclusions must be directly derived from the provided data.
2.  **Positive and Constructive**: Even if the data is not ideal, use encouraging and constructive language, avoiding blame.
3.  **Clear and Simple**: Use clear, everyday language, avoiding complex jargon.
4.  **In-depth Insight**: Go beyond restating data; uncover the behavioral patterns and potential reasons behind the data.
5.  **JSON Output**: Strictly adhere to the specified JSON Schema format for your output.`
};

export const DAILY_USER_PROMPT_TEMPLATE = {
  'zh-CN': `请根据我今天（日期：{date}）的任务完成数据，为我生成一份简洁、深刻、友好的每日复盘报告。

**核心要求**:
- **总结 (summary)**: 用一句话总结今天的核心表现，要鼓舞人心。
- **内容 (content)**: 对今天的数据进行详细分析，识别出至少1-2个显著的正面模式（如某个类别完成率高、特定时间段效率高等）和1个可改进点。请在内容中用 Markdown 的 \`**\` 符号高亮关键数据和发现，例如“完成了 **80%** 的任务”。
- **亮点 (highlights)**: 提取2-3个最值得称赞的成就或发现，作为列表项。
- **建议 (recommendations)**: 提出1-2个具体的、可操作的、旨在帮助我明天做得更好的建议。

以下是我的数据:
\`\`\`json
{payload_json}
\`\`\``,
  'en-US': `Please generate a concise, insightful, and friendly daily review report for me based on my task completion data for today ({date}).

**Core Requirements**:
- **summary**: Summarize today's core performance in one encouraging sentence.
- **content**: Provide a detailed analysis of today's data, identifying at least 1-2 significant positive patterns (e.g., high completion rate in a category, high efficiency in a specific time slot) and 1 area for improvement. Use Markdown's \`**\` to highlight key data and findings in the content, e.g., "completed **80%** of tasks".
- **highlights**: Extract 2-3 of the most praiseworthy achievements or findings as a list.
- **recommendations**: Offer 1-2 specific, actionable recommendations to help me do better tomorrow.

Here is my data:
\`\`\`json
{payload_json}
\`\`\``
};

export const DAILY_RESULT_SCHEMA = (locale = 'zh-CN') => ({
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: locale === 'zh-CN' ? "一个非常简短的（15-20字）、鼓舞人心或总结性的标题。" : "A very short (15-20 words), inspiring or summary title."
        },
        content: {
            type: "string",
            description: locale === 'zh-CN' ? "一段详细的分析文字（约100-150字），整合了数据观察、模式识别和因果推测。使用Markdown加粗关键信息。" : "A detailed analysis text (about 100-150 words) integrating data observation, pattern recognition, and causal inference. Use Markdown for bolding key information."
        },
        highlights: {
            type: "array",
            items: { "type": "string" },
            description: locale === 'zh-CN' ? "一个包含2-3个字符串的数组，每条都是一个关键的积极发现或成就。" : "An array of 2-3 strings, each being a key positive finding or achievement."
        },
        recommendations: {
            type: "array",
            items: { "type": "string" },
            description: locale === 'zh-CN' ? "一个包含1-2个字符串的数组，每条都是一个具体的、可操作的优化建议。" : "An array of 1-2 strings, each being a specific, actionable recommendation for improvement."
        },
        confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: locale === 'zh-CN' ? "模型对其分析质量的自信度评分（0到1之间）。" : "The model's confidence score in the quality of its analysis (from 0 to 1)."
        }
    },
    required: ["summary", "content", "highlights", "recommendations", "confidence"]
});