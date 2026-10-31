import { RequestOptions } from '@/types/api';
import { ApiError } from './api-errors';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private tokenGetter?: () => Promise<string | null>;

  constructor(
    baseUrl?: string,
    options?: {
      timeoutMs?: number;
      tokenGetter?: () => Promise<string | null>;
    }
  ) {
    this.baseUrl = (
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3000/api/v1'
    ).replace(/\/$/, '');
    this.defaultTimeoutMs = options?.timeoutMs || 15000;
    this.tokenGetter = options?.tokenGetter;
  }

  /**
   * Set custom token resolver (e.g. for testing or custom context)
   */
  setTokenGetter(getter: () => Promise<string | null>) {
    this.tokenGetter = getter;
  }

  /**
   * Resolves current Bearer token, falling back to browser Supabase session if in browser.
   */
  private async resolveToken(explicitToken?: string | null): Promise<string | null> {
    if (explicitToken !== undefined) {
      return explicitToken;
    }

    if (this.tokenGetter) {
      try {
        return await this.tokenGetter();
      } catch {
        return null;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session?.access_token || null;
      } catch {
        return null;
      }
    }

    return null;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, token: explicitToken, headers: customHeaders, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const token = await this.resolveToken(explicitToken);

    const headers = new Headers(customHeaders);
    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: fetchOptions.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return null as unknown as T;
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw ApiError.fromResponse(response.status, data);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw ApiError.timeoutError(this.defaultTimeoutMs);
      }

      throw ApiError.networkError(err);
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Global default instance for application use
export const apiClient = new ApiClient();
