export const WEEKLY_SYSTEM_PROMPT = {
  'zh-CN': `你是一位顶尖的效率专家和数据科学家。你的任务是基于用户提供的一周任务数据，生成一份富有洞察力、战略性和前瞻性的周度总结报告。

你的分析应遵循以下原则：
1.  **宏观视角**：关注一周的趋势、模式和整体表现，而不仅仅是单日数据。
2.  **数据驱动与深度解读**：所有结论必须基于数据，并深入解读数据背后反映的习惯、挑战和机遇。
3.  **战略性建议**：提出的建议应具有指导性，帮助用户优化下一周的规划和执行。
4.  **鼓励与赋能**：用专业且激励人心的语言，让用户感受到掌控感和成长的喜悦。
5.  **输出为JSON**：严格按照指定的JSON Schema格式输出。`,
  'en-US': `You are a top-tier productivity expert and data scientist. Your task is to generate an insightful, strategic, and forward-looking weekly summary report based on the user's weekly task data.

Your analysis should adhere to the following principles:
1.  **Macro Perspective**: Focus on weekly trends, patterns, and overall performance, not just daily data.
2.  **Data-Driven with Deep Interpretation**: All conclusions must be based on data, with in-depth interpretation of the habits, challenges, and opportunities reflected by the data.
3.  **Strategic Recommendations**: Recommendations should be guiding and help the user optimize planning and execution for the next week.
4.  **Encouraging and Empowering**: Use professional and inspiring language to make the user feel a sense of control and the joy of growth.
5.  **JSON Output**: Strictly adhere to the specified JSON Schema format for your output.`
};

export const WEEKLY_USER_PROMPT_TEMPLATE = {
  'zh-CN': `请根据我从 {week_start} 到 {week_end} 这一周的任务完成数据，为我生成一份专业的周度总结报告。

**核心要求**:
- **总结 (summary)**: 用一句话高度概括本周的核心主题或最显著的趋势。
- **内容 (content)**: 对本周的数据进行详细分析，识别出至少2-3个关键趋势（如效率变化、某类任务的集中度、延期模式等）。请在内容中用 Markdown 的 \`**\` 符号高亮关键数据和发现。
- **亮点 (highlights)**: 提取2-3个本周最突出的成就或积极趋势，作为列表项。
- **建议 (recommendations)**: 提出1-2个具有战略性的、旨在帮助我优化下一周工作流程或规划的建议。

以下是我的数据:
\`\`\`json
{payload_json}
\`\`\``,
  'en-US': `Please generate a professional weekly summary report for me based on my task completion data from {week_start} to {week_end}.

**Core Requirements**:
- **summary**: Summarize the core theme or most significant trend of the week in a single, high-level sentence.
- **content**: Provide a detailed analysis of this week's data, identifying at least 2-3 key trends (e.g., productivity changes, concentration on certain task types, rollover patterns). Use Markdown's \`**\` to highlight key data and findings in the content.
- **highlights**: Extract 2-3 of the most outstanding achievements or positive trends from the week as a list.
- **recommendations**: Offer 1-2 strategic recommendations aimed at helping me optimize my workflow or planning for the next week.

Here is my data:
\`\`\`json
{payload_json}
\`\`\``
};

export const WEEKLY_RESULT_SCHEMA = (locale = 'zh-CN') => ({
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: locale === 'zh-CN' ? "一个非常简短的（15-20字）、高度概括本周表现的标题。" : "A very short (15-20 words) title that provides a high-level summary of the week's performance."
        },
        content: {
            type: "string",
            description: locale === 'zh-CN' ? "一段详细的周度分析文字（约150-200字），整合了趋势分析、模式识别和对比。使用Markdown加粗关键信息。" : "A detailed weekly analysis text (about 150-200 words) integrating trend analysis, pattern recognition, and comparisons. Use Markdown for bolding key information."
        },
        highlights: {
            type: "array",
            items: { "type": "string" },
            description: locale === 'zh-CN' ? "一个包含2-3个字符串的数组，每条都是一个关键的周度成就或积极趋势。" : "An array of 2-3 strings, each being a key weekly achievement or positive trend."
        },
        recommendations: {
            type: "array",
            items: { "type": "string" },
            description: locale === 'zh-CN' ? "一个包含1-2个字符串的数组，每条都是一个具体的、具有战略性的下周优化建议。" : "An array of 1-2 strings, each being a specific, strategic recommendation for optimizing the next week."
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