import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingApi } from './matching';
import { ApiClient } from './api-client';
import { FoodCategory } from '@/types/batches';

describe('MatchingApi', () => {
  let mockClient: ApiClient;
  let api: MatchingApi;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
    api = new MatchingApi(mockClient);
  });

  describe('findMatchesForBatch', () => {
    it('calls GET /batches/:batchId/matches with distance and limit params', async () => {
      const mockResponse = {
        batch: {
          id: 'batch-abc',
          batchCode: 'FL-BATCH-01',
          foodName: 'Vegetable Biryani',
          category: FoodCategory.HUMAN_CONSUMPTION,
          availableQuantity: 50,
          quantityUnit: 'portions',
          donorName: 'Grand Hotel',
        },
        matches: [
          {
            recipientOrganisationId: 'org-ngo-1',
            recipientName: 'Hope Foundation',
            organisationType: 'humanitarian_ngo',
            isEligible: true,
            exclusionReasons: [],
            matchScore: 92,
            distanceKm: 3.4,
            batchAvailableQuantity: 50,
            recipientRequestedQuantity: 40,
            recipientStorageCapacityKg: 100,
            quantityUnit: 'portions',
            warnings: [],
            factors: ['Compatible destination: Human Consumption', 'Within distance radius: 3.4 km'],
          },
        ],
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.findMatchesForBatch('batch-abc', { maxDistanceKm: 15, limit: 10 });

      expect(mockClient.get).toHaveBeenCalledWith('/batches/batch-abc/matches', {
        params: { maxDistanceKm: 15, limit: 10 },
      });
      expect(result.batch.batchCode).toBe('FL-BATCH-01');
      expect(result.matches[0].matchScore).toBe(92);
      expect(result.matches[0].isEligible).toBe(true);
    });
  });

  describe('searchEligibleRecipients', () => {
    it('calls GET /recipients/eligible with search filters', async () => {
      const mockResponse = {
        data: [
          {
            organisation_id: 'org-shelter-1',
            organisation_name: 'St. Jude Shelter',
            organisation_type: 'orphanage',
            accepted_categories: [FoodCategory.HUMAN_CONSUMPTION],
            requested_quantity: 60,
            quantity_unit: 'portions',
            distance_km: 5.2,
          },
        ],
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.searchEligibleRecipients({
        category: FoodCategory.HUMAN_CONSUMPTION,
        radiusKm: 20,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/recipients/eligible', {
        params: {
          category: FoodCategory.HUMAN_CONSUMPTION,
          species: undefined,
          lat: undefined,
          lng: undefined,
          radiusKm: 20,
          limit: undefined,
        },
      });
      expect(result.data).toHaveLength(1);
    });
  });
});
