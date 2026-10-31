import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllocationsApi } from './allocations';
import { ApiClient } from './api-client';
import { AllocationStatus } from '@/types/allocations';

describe('AllocationsApi', () => {
  let mockClient: ApiClient;
  let api: AllocationsApi;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
    api = new AllocationsApi(mockClient);
  });

  describe('createAllocation', () => {
    it('calls POST /allocations with exact quantity unit preserved', async () => {
      const dto = {
        batchId: 'batch-uuid-1',
        recipientOrganisationId: 'recipient-uuid-1',
        allocatedQuantity: 25,
        quantityUnit: 'portions',
      };

      const mockResponse = {
        message: 'Food allocation successfully created and inventory reserved.',
        allocation: {
          id: 'alloc-1',
          batch_id: 'batch-uuid-1',
          recipient_organisation_id: 'recipient-uuid-1',
          allocated_quantity: 25,
          quantity_unit: 'portions',
          status: AllocationStatus.PENDING,
          created_at: '2026-10-31T03:00:00Z',
          updated_at: '2026-10-31T03:00:00Z',
        },
        deliveryTask: {
          id: 'task-1',
          status: 'assigned',
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.createAllocation(dto);

      expect(mockClient.post).toHaveBeenCalledWith('/allocations', dto);
      expect(result.allocation.allocated_quantity).toBe(25);
      expect(result.allocation.quantity_unit).toBe('portions');
      expect(result.deliveryTask.status).toBe('assigned');
    });
  });

  describe('listAllocations', () => {
    it('calls GET /allocations with pagination and status filters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'alloc-1',
            batch_id: 'batch-1',
            recipient_organisation_id: 'recip-1',
            allocated_quantity: 15,
            quantity_unit: 'kg',
            status: AllocationStatus.ACCEPTED,
            created_at: '2026-10-31T03:00:00Z',
            updated_at: '2026-10-31T03:15:00Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.listAllocations({ page: 1, limit: 10, status: AllocationStatus.ACCEPTED });

      expect(mockClient.get).toHaveBeenCalledWith('/allocations', {
        params: {
          page: 1,
          limit: 10,
          status: AllocationStatus.ACCEPTED,
          batchId: undefined,
          recipientOrganisationId: undefined,
        },
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('acceptAllocation', () => {
    it('calls POST /allocations/:id/accept', async () => {
      const mockResponse = {
        message: 'Allocation accepted successfully.',
        allocation: {
          id: 'alloc-1',
          status: AllocationStatus.ACCEPTED,
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.acceptAllocation('alloc-1');

      expect(mockClient.post).toHaveBeenCalledWith('/allocations/alloc-1/accept');
      expect(result.allocation.status).toBe(AllocationStatus.ACCEPTED);
    });
  });

  describe('rejectAllocation', () => {
    it('calls POST /allocations/:id/reject with rejection reason', async () => {
      const mockResponse = {
        message: 'Allocation rejected and stock released back to batch.',
        allocation: {
          id: 'alloc-2',
          status: AllocationStatus.CANCELLED,
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.rejectAllocation('alloc-2', 'Storage full today');

      expect(mockClient.post).toHaveBeenCalledWith('/allocations/alloc-2/reject', {
        reason: 'Storage full today',
      });
      expect(result.allocation.status).toBe(AllocationStatus.CANCELLED);
    });
  });

  describe('cancelAllocation', () => {
    it('calls POST /allocations/:id/cancel with cancellation reason', async () => {
      const mockResponse = {
        message: 'Allocation cancelled successfully.',
        allocation: {
          id: 'alloc-3',
          status: AllocationStatus.CANCELLED,
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.cancelAllocation('alloc-3', 'Kitchen closing early');

      expect(mockClient.post).toHaveBeenCalledWith('/allocations/alloc-3/cancel', {
        reason: 'Kitchen closing early',
      });
      expect(result.allocation.status).toBe(AllocationStatus.CANCELLED);
    });
  });
});
