/**
 * OAuth 配置和工具函数
 */

// OAuth 提供商配置
export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    icon: 'google',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/google`,
    scope: 'openid email profile',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
  },
  github: {
    name: 'GitHub',
    icon: 'github',
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/github`,
    scope: 'user:email',
    authUrl: 'https://github.com/login/oauth/authorize'
  }
};

/**
 * 生成 OAuth 授权 URL
 */
export function generateOAuthUrl(provider) {
  const config = OAUTH_PROVIDERS[provider];
  if (!config || !config.clientId) {
    throw new Error(`OAuth 提供商 ${provider} 未配置`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: generateState()
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * 生成随机状态参数
 */
function generateState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 处理 OAuth 回调
 */
export async function handleOAuthCallback(provider, code, state) {
  try {
    const response = await fetch(`/api/auth/oauth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        redirect_uri: OAUTH_PROVIDERS[provider].redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('OAuth 认证失败');
    }

    const result = await response.json();
    
    if (result.success) {
      // 保存认证信息
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_data', JSON.stringify(result.user));
      
      return result;
    } else {
      throw new Error(result.error || 'OAuth 认证失败');
    }
  } catch (error) {
    console.error('OAuth 回调处理错误:', error);
    throw error;
  }
}

/**
 * 检查 OAuth 提供商是否可用
 */
export function isOAuthProviderAvailable(provider) {
  const config = OAUTH_PROVIDERS[provider];
  return !!(config && config.clientId);
}

/**
 * 获取可用的 OAuth 提供商列表
 */
export function getAvailableOAuthProviders() {
  return Object.keys(OAUTH_PROVIDERS).filter(isOAuthProviderAvailable);
}
