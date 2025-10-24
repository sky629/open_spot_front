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
      // 프로덕션 빌드 시 최적화
      minify: 'esbuild',
      esbuild: {
        // debugger만 제거 (console은 logger 시스템이 제어)
        drop: mode === 'production' ? ['debugger'] : [],
        // 순수 함수 호출 제거 (사용되지 않는 logger 호출 등)
        pure: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
    },
    define: {
      __VITE_NAVER_MAP_CLIENT_ID__: JSON.stringify(env.VITE_NAVER_MAP_CLIENT_ID || ''),
      __VITE_API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8080'),
      __VITE_GOOGLE_CLIENT_ID__: JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
      __VITE_GOOGLE_OAUTH_URL__: JSON.stringify(env.VITE_GOOGLE_OAUTH_URL || 'http://localhost:8080/oauth2/authorization/google'),
    },
  }
})