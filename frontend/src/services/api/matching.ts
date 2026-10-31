import { apiClient, ApiClient } from './api-client';
import {
  BatchMatchesResponse,
  EligibleRecipient,
  MatchQueryDto,
  RecipientSearchDto,
} from '@/types/matching';

export class MatchingApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Retrieve recipient matching recommendations for an approved food batch.
   * Backend endpoint: GET /api/v1/batches/:batchId/matches
   */
  async findMatchesForBatch(batchId: string, query: MatchQueryDto = {}): Promise<BatchMatchesResponse> {
    return this.client.get<BatchMatchesResponse>(`/batches/${batchId}/matches`, {
      params: {
        maxDistanceKm: query.maxDistanceKm,
        limit: query.limit,
      },
    });
  }

  /**
   * Search verified recipients with active requirements matching category and geographic criteria.
   * Backend endpoint: GET /api/v1/recipients/eligible
   */
  async searchEligibleRecipients(query: RecipientSearchDto = {}): Promise<{ data: EligibleRecipient[] }> {
    return this.client.get<{ data: EligibleRecipient[] }>('/recipients/eligible', {
      params: {
        category: query.category,
        species: query.species,
        lat: query.lat,
        lng: query.lng,
        radiusKm: query.radiusKm,
        limit: query.limit,
      },
    });
  }
}

export const matchingApi = new MatchingApi();
