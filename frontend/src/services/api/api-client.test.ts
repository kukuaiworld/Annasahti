import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from './api-client';
import { ApiError } from './api-errors';

describe('ApiClient', () => {
  const baseUrl = 'http://api.foodloop.test/api/v1';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches the Supabase access token in Authorization header', async () => {
    const mockToken = 'mock-supabase-jwt-12345';
    const mockClient = new ApiClient(baseUrl, {
      tokenGetter: async () => mockToken,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const result = await mockClient.get('/test-endpoint');

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('http://api.foodloop.test/api/v1/test-endpoint');

    const headers = calledInit.headers as Headers;
    expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('handles HTTP error responses and parses structured API error', async () => {
    const mockClient = new ApiClient(baseUrl);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        statusCode: 400,
        message: ['Quantity must be positive', 'Pickup deadline is required'],
        error: 'Bad Request',
      }),
    });

    await expect(mockClient.post('/batches', {})).rejects.toThrow(ApiError);

    try {
      await mockClient.post('/batches', {});
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(400);
      expect(err.message).toContain('Quantity must be positive');
      expect(err.details).toEqual(['Quantity must be positive', 'Pickup deadline is required']);
    }
  });

  it('handles 401 Unauthorized errors correctly', async () => {
    const mockClient = new ApiClient(baseUrl);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        statusCode: 401,
        message: 'Authentication token required.',
        error: 'Unauthorized',
      }),
    });

    await expect(mockClient.get('/batches')).rejects.toThrow(ApiError);
  });

  it('handles 403 Forbidden errors for unprovisioned users', async () => {
    const mockClient = new ApiClient(baseUrl);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        statusCode: 403,
        message: 'User profile not provisioned. Access denied.',
        error: 'Forbidden',
      }),
    });

    await expect(mockClient.get('/batches')).rejects.toThrow(ApiError);
  });

  it('handles network failure without leaking credentials', async () => {
    const mockClient = new ApiClient(baseUrl);
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(mockClient.get('/batches')).rejects.toThrow(ApiError);

    try {
      await mockClient.get('/batches');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(0);
      expect(err.error).toBe('NetworkError');
    }
  });
});
