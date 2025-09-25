/**
 * Vite 插件：CSP nonce 注入
 * 为所有脚本标签注入 nonce 属性
 */

export function cspNoncePlugin() {
  return {
    name: 'csp-nonce',
    transformIndexHtml: {
      enforce: 'post',
      transform(html, context) {
        // 生成 nonce
        const nonce = context.server?.config?.server?.middlewareMode 
          ? 'dev-nonce' 
          : Buffer.from(Math.random().toString()).toString('base64').slice(0, 16);
        
        // 注入 nonce 到所有 script 标签
        html = html.replace(
          /<script([^>]*)>/g,
          (match, attributes) => {
            // 如果已经有 nonce 属性，跳过
            if (attributes.includes('nonce=')) {
              return match;
            }
            return `<script${attributes} nonce="${nonce}">`;
          }
        );
        
        // 注入 nonce 到所有 style 标签（如果需要）
        html = html.replace(
          /<style([^>]*)>/g,
          (match, attributes) => {
            if (attributes.includes('nonce=')) {
              return match;
            }
            return `<style${attributes} nonce="${nonce}">`;
          }
        );
        
        // 将 nonce 添加到 window 对象
        html = html.replace(
          '</head>',
          `<script nonce="${nonce}">window.__CSP_NONCE__ = "${nonce}";</script></head>`
        );
        
        return html;
      }
    }
  };
}
