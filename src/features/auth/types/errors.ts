// Auth Error Types and Interfaces

export enum LoginErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  OAUTH_CANCELED = 'OAUTH_CANCELED',
  OAUTH_DENIED = 'OAUTH_DENIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LoginError {
  code: LoginErrorCode;
  message: string;
  details?: string;
  timestamp?: number;
  requestId?: string;
}

export interface LoginErrorParams {
  code: string;
  msg: string;
  details?: string;
}

export interface LoginErrorState {
  error: LoginError | null;
  isError: boolean;
  errorHistory: LoginError[];
}