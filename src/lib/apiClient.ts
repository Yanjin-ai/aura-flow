import axios, { AxiosError } from "axios";

// 调试：打印环境变量
console.log('API Client - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173',
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

