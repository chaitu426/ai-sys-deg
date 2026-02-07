const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 15000;

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  token?: string | null;
  timeout?: number;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  resource: RequestInfo,
  options: RequestInit & { timeout?: number } = {}
) {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, token, timeout } = options;

  const config: RequestInit & { timeout?: number } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout,
  };

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    if (body instanceof FormData) {
      config.body = body;
      // Let the browser set the Content-Type header with the boundary
      delete (config.headers as Record<string, string>)['Content-Type'];
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({})); // Handle empty or non-json responses gracefully

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'API Request failed', response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error(`[API Error] ${method} ${endpoint}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Network error');
  }
}

export const api = {
  get: <T>(endpoint: string, token?: string | null, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET', token }),

  post: <T>(endpoint: string, body: any, token?: string | null, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body, token }),

  put: <T>(endpoint: string, body: any, token?: string | null, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body, token }),

  patch: <T>(endpoint: string, body: any, token?: string | null, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body, token }),

  delete: <T>(endpoint: string, token?: string | null, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE', token }),
};
