import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    define: {
      __NAVER_MAP_CLIENT_ID__: JSON.stringify(env.VITE_NAVER_MAP_CLIENT_ID || ''),
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8080'),
      __GOOGLE_CLIENT_ID__: JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
      __OAUTH_REDIRECT_URI__: JSON.stringify(env.VITE_OAUTH_REDIRECT_URI || ''),
    },
  }
})