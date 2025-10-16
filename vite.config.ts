import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      nodePolyfills(),
    ],
    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    build: {
      // 프로덕션 빌드 시 console.log, debugger 제거
      minify: 'esbuild',
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },
    define: {
      __VITE_NAVER_MAP_CLIENT_ID__: JSON.stringify(env.VITE_NAVER_MAP_CLIENT_ID || ''),
      __VITE_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8080'),
      __VITE_GOOGLE_CLIENT_ID__: JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
    },
  }
})