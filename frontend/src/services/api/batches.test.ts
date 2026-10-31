import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchesApi } from './batches';
import { ApiClient } from './api-client';
import { CreateFoodBatchDto, FoodBatchStatus } from '@/types/batches';

describe('BatchesApi', () => {
  let mockClient: ApiClient;
  let batchesApi: BatchesApi;

  beforeEach(() => {
    mockClient = new ApiClient('http://api.foodloop.test/api/v1');
    batchesApi = new BatchesApi(mockClient);
    vi.restoreAllMocks();
  });

  it('submits valid CreateFoodBatchDto to POST /batches and receives server-generated batch', async () => {
    const payload: CreateFoodBatchDto = {
      donorOrganisationId: '88888888-4444-4444-4444-121212121212',
      foodName: 'Nutritious Dal Khichdi & Steamed Veg',
      quantity: 50,
      quantityUnit: 'kg',
      estimatedWeightKg: 50,
      storageInstructions: 'Insulated hot containers',
    };

    const serverResponse = {
      id: 'batch-uuid-1234',
      batch_code: 'FL-A1B2C3',
      donor_organisation_id: payload.donorOrganisationId,
      food_name: payload.foodName,
      quantity: 50,
      quantity_unit: 'kg',
      status: FoodBatchStatus.PENDING_INSPECTION,
      created_at: new Date().toISOString(),
    };

    const postSpy = vi.spyOn(mockClient, 'post').mockResolvedValue(serverResponse);

    const result = await batchesApi.createBatch(payload);

    expect(postSpy).toHaveBeenCalledWith('/batches', payload);
    expect(result.id).toBe('batch-uuid-1234');
    expect(result.batch_code).toBe('FL-A1B2C3');
    expect(result.status).toBe(FoodBatchStatus.PENDING_INSPECTION);
  });

  it('queries GET /batches with pagination and status filters', async () => {
    const getSpy = vi.spyOn(mockClient, 'get').mockResolvedValue({
      data: [
        {
          id: 'b1',
          batch_code: 'FL-001',
          food_name: 'Apples',
          quantity: 20,
          quantity_unit: 'boxes',
          status: FoodBatchStatus.APPROVED,
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const result = await batchesApi.listBatches({
      page: 1,
      limit: 10,
      status: FoodBatchStatus.APPROVED,
      search: 'Apples',
    });

    expect(getSpy).toHaveBeenCalledWith('/batches', {
      params: {
        page: 1,
        limit: 10,
        status: FoodBatchStatus.APPROVED,
        category: undefined,
        donorOrganisationId: undefined,
        expiryAfter: undefined,
        pickupBefore: undefined,
        search: 'Apples',
      },
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].food_name).toBe('Apples');
  });
});
