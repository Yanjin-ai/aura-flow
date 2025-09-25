import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { cspNoncePlugin } from './src/plugins/csp-nonce.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cspNoncePlugin()
  ],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 UI 库分离
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // 将工具库分离
          'utils-vendor': ['axios', 'date-fns']
        }
      }
    },
    // 构建优化
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    },
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // 生成 source map（生产环境可选）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  // 性能优化
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
}) 