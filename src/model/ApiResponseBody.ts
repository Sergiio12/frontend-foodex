export interface ApiResponseBody<T> {
  status: string;
  message?: string;
  data: T;
  timestamp?: string;
}