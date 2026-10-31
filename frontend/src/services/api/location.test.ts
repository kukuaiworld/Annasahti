import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationApi } from './location';
import { ApiClient } from './api-client';

describe('LocationApi', () => {
  let mockClient: ApiClient;
  let api: LocationApi;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
    api = new LocationApi(mockClient);
  });

  describe('geocodeAddress', () => {
    it('calls GET /location/geocode with address param', async () => {
      const mockResult = {
        success: true,
        configured: true,
        latitude: 28.6139,
        longitude: 77.209,
        formattedAddress: 'New Delhi, Delhi, India',
      };
      vi.mocked(mockClient.get).mockResolvedValue(mockResult);

      const result = await api.geocodeAddress('New Delhi');

      expect(mockClient.get).toHaveBeenCalledWith('/location/geocode', {
        params: { address: 'New Delhi' },
      });
      expect(result.latitude).toBe(28.6139);
    });
  });

  describe('calculateRoute', () => {
    it('calls POST /location/routes with origin and destination', async () => {
      const origin = { latitude: 28.7041, longitude: 77.1025 };
      const destination = { latitude: 28.6139, longitude: 77.209 };
      const mockResult = {
        success: true,
        configured: true,
        distanceKm: 18.5,
        durationText: '32 mins',
        durationSeconds: 1920,
      };
      vi.mocked(mockClient.post).mockResolvedValue(mockResult);

      const result = await api.calculateRoute(origin, destination);

      expect(mockClient.post).toHaveBeenCalledWith('/location/routes', {
        origin,
        destination,
      });
      expect(result.distanceKm).toBe(18.5);
      expect(result.durationText).toBe('32 mins');
    });
  });
});
