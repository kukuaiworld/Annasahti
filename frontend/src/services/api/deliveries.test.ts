import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeliveriesApi } from './deliveries';
import { ApiClient } from './api-client';
import { DeliveryStatus } from '@/types/deliveries';

describe('DeliveriesApi', () => {
  let mockClient: ApiClient;
  let api: DeliveriesApi;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
    api = new DeliveriesApi(mockClient);
  });

  describe('listDeliveries', () => {
    it('calls GET /deliveries with status and volunteer filters', async () => {
      const mockResponse = {
        data: [
          {
            id: 'deliv-1',
            allocation_id: 'alloc-1',
            status: DeliveryStatus.ASSIGNED,
            allocated_quantity: 40,
            quantity_unit: 'portions',
            food_name: 'Rice & Curry',
            batch_code: 'FL-BATCH-01',
            created_at: '2026-10-31T03:00:00Z',
            updated_at: '2026-10-31T03:00:00Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.listDeliveries({ page: 1, limit: 10, status: DeliveryStatus.ASSIGNED });

      expect(mockClient.get).toHaveBeenCalledWith('/deliveries', {
        params: {
          page: 1,
          limit: 10,
          status: DeliveryStatus.ASSIGNED,
          volunteerId: undefined,
          allocationId: undefined,
        },
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getDeliveryById', () => {
    it('calls GET /deliveries/:id', async () => {
      const mockRecord = {
        id: 'deliv-99',
        allocation_id: 'alloc-99',
        status: DeliveryStatus.IN_TRANSIT,
        food_name: 'Fresh Bread',
        allocated_quantity: 20,
        quantity_unit: 'boxes',
        created_at: '2026-10-31T03:00:00Z',
        updated_at: '2026-10-31T03:30:00Z',
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockRecord);

      const result = await api.getDeliveryById('deliv-99');

      expect(mockClient.get).toHaveBeenCalledWith('/deliveries/deliv-99');
      expect(result.id).toBe('deliv-99');
      expect(result.status).toBe(DeliveryStatus.IN_TRANSIT);
    });
  });

  describe('recordPickup', () => {
    it('calls POST /deliveries/:id/pickup', async () => {
      const mockResponse = {
        message: 'Pickup milestone recorded. Delivery is now in transit.',
        deliveryTask: {
          id: 'deliv-1',
          status: DeliveryStatus.IN_TRANSIT,
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.recordPickup('deliv-1', { pickupNotes: 'Checked temperature 4C' });

      expect(mockClient.post).toHaveBeenCalledWith('/deliveries/deliv-1/pickup', {
        pickupNotes: 'Checked temperature 4C',
      });
      expect(result.deliveryTask.status).toBe(DeliveryStatus.IN_TRANSIT);
    });
  });

  describe('completeDelivery', () => {
    it('calls POST /deliveries/:id/complete with reconciled quantities', async () => {
      const dto = {
        receivedQuantity: 38,
        damagedQuantity: 2,
        missingQuantity: 0,
        quantityUnit: 'portions',
        discrepancyReason: 'Two trays cracked in transit',
        recipientNotes: 'Dock delivery accepted',
      };

      const mockResponse = {
        message: 'Delivery confirmed successfully by recipient organisation.',
        deliveryTask: {
          id: 'deliv-1',
          status: DeliveryStatus.DELIVERED,
        },
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockResponse);

      const result = await api.completeDelivery('deliv-1', dto);

      expect(mockClient.post).toHaveBeenCalledWith('/deliveries/deliv-1/complete', dto);
      expect(result.deliveryTask.status).toBe(DeliveryStatus.DELIVERED);
    });
  });

  describe('updateVolunteerLocation', () => {
    it('calls PATCH /deliveries/:id/location with latitude and longitude', async () => {
      const mockResponse = {
        message: 'Volunteer location updated successfully.',
        deliveryId: 'deliv-1',
        latitude: 28.6139,
        longitude: 77.209,
        updatedAt: '2026-10-31T06:00:00Z',
      };

      vi.mocked(mockClient.patch).mockResolvedValue(mockResponse);

      const result = await api.updateVolunteerLocation('deliv-1', {
        latitude: 28.6139,
        longitude: 77.209,
      });

      expect(mockClient.patch).toHaveBeenCalledWith('/deliveries/deliv-1/location', {
        latitude: 28.6139,
        longitude: 77.209,
      });
      expect(result.latitude).toBe(28.6139);
      expect(result.longitude).toBe(77.209);
    });
  });
});
