// Google Identity Services 타입 정의

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GoogleSignInButtonConfig) => void;
          revoke: (hint: string, callback: () => void) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => GoogleTokenClient;
          hasGrantedAllScopes: (tokenResponse: TokenResponse, ...scopes: string[]) => boolean;
          hasGrantedAnyScope: (tokenResponse: TokenResponse, ...scopes: string[]) => boolean;
          revoke: (accessToken: string, callback?: () => void) => void;
        };
      };
    };
  }
}

interface GoogleIdConfiguration {
  client_id: string;
  callback?: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  login_uri?: string;
  native_callback?: (response: CredentialResponse) => void;
  prompt_parent_id?: string;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: () => void;
}

interface CredentialResponse {
  credential: string;
  select_by: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'brn_add_session' | 'btn_confirm_add_session';
  client_id?: string;
}

interface GoogleSignInButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
  local?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback?: (response: TokenResponse) => void;
  error_callback?: (error: TokenError) => void;
  prompt?: 'none' | 'consent' | 'select_account';
  enable_granular_consent?: boolean;
  include_granted_scopes?: boolean;
  state?: string;
  hint?: string;
  hosted_domain?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: Partial<TokenClientConfig>) => void;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenError {
  type: 'popup_closed' | 'popup_failed_to_open' | 'unknown';
  message: string;
}

interface PromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => 'browser_not_supported' | 'invalid_client' | 'missing_client_id' | 'opt_out_or_no_session' | 'secure_http_required' | 'suppressed_by_user' | 'unregistered_origin' | 'unknown_reason';
  isSkippedMoment: () => boolean;
  getSkippedReason: () => 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed';
  isDismissedMoment: () => boolean;
  getDismissedReason: () => 'credential_returned' | 'cancel_called' | 'flow_restarted';
  getMomentType: () => 'display' | 'skipped' | 'dismissed';
}

export {};