import axios, { AxiosError } from "axios";

// 计算后端 API 基址：
// - 若 VITE_API_BASE_URL 指向 supabase.co，判定为误配置并忽略
// - 生产环境默认使用相对路径 '/'，避免跨域
// - 开发环境回退到本地端口
let configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (configuredBase && /supabase\.co/.test(configuredBase)) {
  configuredBase = undefined; // 忽略误把 Supabase URL 当作后端 API 的情况
}
const apiBaseUrl = configuredBase || (import.meta.env.DEV ? 'http://localhost:3001' : '/');

// 调试输出：便于排查部署配置
if (import.meta.env.DEV) {
  console.log('API Client - resolved apiBaseUrl:', apiBaseUrl);
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;
    // 统一错误日志
    console.error("API Error:", { url: error.config?.url, status, message });
    // 统一抛出友好错误
    return Promise.reject(new Error(message || `请求失败(${status || 'unknown'})`));
  }
);

export default apiClient;

// 简单注释：统一 axios 客户端，读取 baseURL=VITE_API_BASE_URL，并集中处理错误。

