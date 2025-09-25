// 桥接文件：对齐 provider 期望的接口形态，避免运行时报错。
// 不修改原有 classify.jsx 文件，保证最小侵入、可逆。

import {
  CLASSIFY_SYSTEM_PROMPT,
  CLASSIFY_RESULT_SCHEMA,
  buildClassifyUserPrompt,
} from "./classify.jsx";

// provider 期望：TASK_CLASSIFY_SYSTEM_PROMPT 是一个按 locale 映射的对象
export const TASK_CLASSIFY_SYSTEM_PROMPT = {
  "zh-CN": CLASSIFY_SYSTEM_PROMPT,
  "en-US": CLASSIFY_SYSTEM_PROMPT,
};

// provider 期望：TASK_CLASSIFY_USER_PROMPT_TEMPLATE 是一个按 locale 映射的“模板字符串”，
// 其中包含占位符 {task_content}，后续通过 .replace('{task_content}', text) 注入文案。
const USER_TEMPLATE_ZH = `请对以下任务进行分类：\n\n任务内容:"{task_content}"\n\n请返回JSON格式的分类结果。`;
const USER_TEMPLATE_EN = `Please classify the following task:\n\nTask: "{task_content}"\n\nReturn the result in strict JSON format.`;

export const TASK_CLASSIFY_USER_PROMPT_TEMPLATE = {
  "zh-CN": USER_TEMPLATE_ZH,
  "en-US": USER_TEMPLATE_EN,
};

// provider 期望：TASK_CLASSIFY_RESULT_SCHEMA 是一个函数 (locale) => schema
export const TASK_CLASSIFY_RESULT_SCHEMA = (_locale = "zh-CN") => CLASSIFY_RESULT_SCHEMA;

// 备注：保留对原有函数的访问（若外部使用到了可继续使用）
export { buildClassifyUserPrompt };
