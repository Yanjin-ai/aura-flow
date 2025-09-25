import { apiClient } from '../lib/apiClient.js';

// 导出集成服务接口（使用新的平台适配层）
export const Core = apiClient.integrations.Core;

export const InvokeLLM = apiClient.integrations.Core.InvokeLLM;

export const SendEmail = apiClient.integrations.Core.SendEmail;

export const UploadFile = apiClient.integrations.Core.UploadFile;

export const GenerateImage = apiClient.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = apiClient.integrations.Core.ExtractDataFromUploadedFile;

export const CreateFileSignedUrl = apiClient.integrations.Core.CreateFileSignedUrl;

export const UploadPrivateFile = apiClient.integrations.Core.UploadPrivateFile;






