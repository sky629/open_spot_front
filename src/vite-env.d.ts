/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NAVER_MAP_CLIENT_ID: string;
  readonly API_BASE_URL: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly OAUTH_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}