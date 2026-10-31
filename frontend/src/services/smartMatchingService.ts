/**
 * FoodLoop Matching Service Architecture
 *
 * NOTE: Production matching recommendations are computed exclusively by the
 * FoodLoop NestJS backend matching engine utilizing PostgreSQL + PostGIS spatial
 * queries (ST_DWithin, capacity verification, dietary compatibility, and cold-chain constraints).
 *
 * Client-side auto-matching and automated consignment mutation have been removed
 * to prevent over-allocation and ensure all food batches remain in HOLD until inspected.
 */

import { apiClient } from './api/api-client';

export interface BackendMatchCandidate {
  organisationId: string;
  organisationName: string;
  organisationType: string;
  distanceMeters: number;
  acceptedCategories: string[];
  maxCapacityKg?: number;
  dietaryPreference?: string;
  score?: number;
}

/**
 * Fetches verified recipient recommendations from the backend PostGIS matching endpoint.
 */
export async function fetchBatchMatches(batchId: string): Promise<BackendMatchCandidate[]> {
  try {
    return await apiClient.get<BackendMatchCandidate[]>(`/batches/${batchId}/matches`);
  } catch (err) {
    console.warn(`Failed to fetch backend matches for batch ${batchId}:`, err);
    return [];
  }
}
