import { apiClient, ApiClient } from './api-client';
import {
  AllocationQueryDto,
  AllocationsListResponse,
  CreateAllocationDto,
  FoodAllocationRecord,
} from '@/types/allocations';

export class AllocationsApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Create an allocation reservation for an approved batch to a verified recipient.
   * Backend endpoint: POST /api/v1/allocations
   */
  async createAllocation(
    dto: CreateAllocationDto
  ): Promise<{ message: string; allocation: FoodAllocationRecord; deliveryTask: any }> {
    return this.client.post<{ message: string; allocation: FoodAllocationRecord; deliveryTask: any }>(
      '/allocations',
      dto
    );
  }

  /**
   * List allocations scoped to the active user's organisation or delivery relationships.
   * Backend endpoint: GET /api/v1/allocations
   */
  async listAllocations(query: AllocationQueryDto = {}): Promise<AllocationsListResponse> {
    return this.client.get<AllocationsListResponse>('/allocations', {
      params: {
        page: query.page,
        limit: query.limit,
        status: query.status,
        batchId: query.batchId,
        recipientOrganisationId: query.recipientOrganisationId,
      },
    });
  }

  /**
   * Retrieve allocation details by ID with delivery task status.
   * Backend endpoint: GET /api/v1/allocations/:id
   */
  async getAllocationById(id: string): Promise<FoodAllocationRecord> {
    return this.client.get<FoodAllocationRecord>(`/allocations/${id}`);
  }

  /**
   * Recipient accepts a pending allocation offer.
   * Backend endpoint: POST /api/v1/allocations/:id/accept
   */
  async acceptAllocation(id: string): Promise<{ message: string; allocation: FoodAllocationRecord }> {
    return this.client.post<{ message: string; allocation: FoodAllocationRecord }>(
      `/allocations/${id}/accept`
    );
  }

  /**
   * Recipient declines a pending allocation offer with a required reason.
   * Backend endpoint: POST /api/v1/allocations/:id/reject
   */
  async rejectAllocation(
    id: string,
    reason: string
  ): Promise<{ message: string; allocation: FoodAllocationRecord }> {
    return this.client.post<{ message: string; allocation: FoodAllocationRecord }>(
      `/allocations/${id}/reject`,
      { reason }
    );
  }

  /**
   * Donor or admin cancels an eligible allocation before completion.
   * Backend endpoint: POST /api/v1/allocations/:id/cancel
   */
  async cancelAllocation(
    id: string,
    reason: string
  ): Promise<{ message: string; allocation: FoodAllocationRecord }> {
    return this.client.post<{ message: string; allocation: FoodAllocationRecord }>(
      `/allocations/${id}/cancel`,
      { reason }
    );
  }
}

export const allocationsApi = new AllocationsApi();
