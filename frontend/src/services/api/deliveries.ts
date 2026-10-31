import { apiClient, ApiClient } from './api-client';
import {
  AssignVolunteerDto,
  CompleteDeliveryDto,
  DeliveriesListResponse,
  DeliveryQueryDto,
  DeliveryTaskRecord,
  PickupDeliveryDto,
} from '@/types/deliveries';

export class DeliveriesApi {
  constructor(private readonly client: ApiClient = apiClient) {}

  /**
   * List delivery tasks scoped to active role and organisation.
   * Backend endpoint: GET /api/v1/deliveries
   */
  async listDeliveries(query: DeliveryQueryDto = {}): Promise<DeliveriesListResponse> {
    return this.client.get<DeliveriesListResponse>('/deliveries', {
      params: {
        page: query.page,
        limit: query.limit,
        status: query.status,
        volunteerId: query.volunteerId,
        allocationId: query.allocationId,
      },
    });
  }

  /**
   * Get delivery task details by ID.
   * Backend endpoint: GET /api/v1/deliveries/:deliveryId
   */
  async getDeliveryById(deliveryId: string): Promise<DeliveryTaskRecord> {
    return this.client.get<DeliveryTaskRecord>(`/deliveries/${deliveryId}`);
  }

  /**
   * Assign or claim a volunteer for an authorized delivery task.
   * Backend endpoint: POST /api/v1/deliveries/:deliveryId/assign
   */
  async assignVolunteer(
    deliveryId: string,
    dto: AssignVolunteerDto
  ): Promise<{ message: string; deliveryTask: DeliveryTaskRecord }> {
    return this.client.post<{ message: string; deliveryTask: DeliveryTaskRecord }>(
      `/deliveries/${deliveryId}/assign`,
      dto
    );
  }

  /**
   * Record food pickup milestone by assigned volunteer.
   * Backend endpoint: POST /api/v1/deliveries/:deliveryId/pickup
   */
  async recordPickup(
    deliveryId: string,
    dto: PickupDeliveryDto = {}
  ): Promise<{ message: string; deliveryTask: DeliveryTaskRecord }> {
    return this.client.post<{ message: string; deliveryTask: DeliveryTaskRecord }>(
      `/deliveries/${deliveryId}/pickup`,
      dto
    );
  }

  /**
   * Independent recipient delivery confirmation with reconciliation.
   * Backend endpoint: POST /api/v1/deliveries/:deliveryId/complete
   */
  async completeDelivery(
    deliveryId: string,
    dto: CompleteDeliveryDto
  ): Promise<{ message: string; deliveryTask: DeliveryTaskRecord }> {
    return this.client.post<{ message: string; deliveryTask: DeliveryTaskRecord }>(
      `/deliveries/${deliveryId}/complete`,
      dto
    );
  }

  /**
   * Cancel delivery task.
   * Backend endpoint: POST /api/v1/deliveries/:deliveryId/cancel
   */
  async cancelDelivery(
    deliveryId: string,
    reason: string
  ): Promise<{ message: string; deliveryTask: DeliveryTaskRecord }> {
    return this.client.post<{ message: string; deliveryTask: DeliveryTaskRecord }>(
      `/deliveries/${deliveryId}/cancel`,
      { reason }
    );
  }

  /**
   * Update volunteer's live location for active delivery task (requires consent).
   * Backend endpoint: PATCH /api/v1/deliveries/:deliveryId/location
   */
  async updateVolunteerLocation(
    deliveryId: string,
    location: { latitude: number; longitude: number }
  ): Promise<{ message: string; deliveryId: string; latitude: number; longitude: number; updatedAt: string }> {
    return this.client.patch<{
      message: string;
      deliveryId: string;
      latitude: number;
      longitude: number;
      updatedAt: string;
    }>(`/deliveries/${deliveryId}/location`, location);
  }
}

export const deliveriesApi = new DeliveriesApi();
