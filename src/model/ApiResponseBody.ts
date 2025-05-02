export interface ApiResponseBody<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  timestamp?: string;
} 