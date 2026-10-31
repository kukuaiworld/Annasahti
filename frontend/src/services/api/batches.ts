import { apiClient, ApiClient } from './api-client';
import {
  BatchQueryDto,
  CreateFoodBatchDto,
  FoodBatchDetail,
  FoodBatchRecord,
  SafeChainEvent,
  SplitBatchDto,
  UpdateFoodBatchDto,
} from '@/types/batches';
import { PaginatedResponse } from '@/types/api';

export class BatchesApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * Create a new food batch consignment.
   * Food enters initial PENDING_INSPECTION / HOLD state.
   */
  async createBatch(dto: CreateFoodBatchDto): Promise<FoodBatchRecord> {
    return this.client.post<FoodBatchRecord>('/batches', dto);
  }

  /**
   * List food batches with filtering and pagination.
   */
  async listBatches(query: BatchQueryDto = {}): Promise<PaginatedResponse<FoodBatchRecord>> {
    return this.client.get<PaginatedResponse<FoodBatchRecord>>('/batches', {
      params: {
        page: query.page,
        limit: query.limit,
        status: query.status,
        category: query.category,
        donorOrganisationId: query.donorOrganisationId,
        expiryAfter: query.expiryAfter,
        pickupBefore: query.pickupBefore,
        search: query.search,
      },
    });
  }

  /**
   * Retrieve a food batch by ID with inspections and hierarchy.
   */
  async getBatchById(id: string): Promise<FoodBatchDetail> {
    return this.client.get<FoodBatchDetail>(`/batches/${id}`);
  }

  /**
   * Update food batch properties.
   */
  async updateBatch(id: string, dto: UpdateFoodBatchDto): Promise<FoodBatchRecord> {
    return this.client.patch<FoodBatchRecord>(`/batches/${id}`, dto);
  }

  /**
   * Cancel a food batch before pickup.
   */
  async cancelBatch(id: string, reason: string): Promise<FoodBatchRecord> {
    return this.client.post<FoodBatchRecord>(`/batches/${id}/cancel`, { reason });
  }

  /**
   * Split a batch into traceable child consignments.
   */
  async splitBatch(id: string, dto: SplitBatchDto): Promise<FoodBatchRecord[]> {
    return this.client.post<FoodBatchRecord[]>(`/batches/${id}/split`, dto);
  }

  /**
   * Retrieve SafeChain audit events for a batch.
   */
  async getBatchHistory(id: string): Promise<SafeChainEvent[]> {
    return this.client.get<SafeChainEvent[]>(`/batches/${id}/history`);
  }
}

export const batchesApi = new BatchesApi();
