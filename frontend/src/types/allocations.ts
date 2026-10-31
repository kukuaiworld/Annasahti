import { PaginationMeta } from './api';

export enum AllocationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface FoodAllocationRecord {
  id: string;
  batch_id: string;
  recipient_organisation_id: string;
  allocated_quantity: number;
  quantity_unit: string;
  status: AllocationStatus | string;
  allocated_by?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  food_name?: string;
  batch_code?: string;
  batch_category?: string;
  donor_name?: string;
  donor_address?: string;
  recipient_name?: string;
  recipient_address?: string;
  deliveryTasks?: Array<{
    id: string;
    allocation_id: string;
    status: string;
    volunteer_id?: string;
    volunteer_name?: string;
    volunteer_phone?: string | null;
    pickup_deadline?: string;
    delivery_deadline?: string;
    created_at: string;
  }>;
}

export interface CreateAllocationDto {
  batchId: string;
  recipientOrganisationId: string;
  allocatedQuantity: number;
  quantityUnit: string;
  idempotencyKey?: string;
}

export interface AllocationQueryDto {
  page?: number;
  limit?: number;
  status?: AllocationStatus | string;
  batchId?: string;
  recipientOrganisationId?: string;
}

export interface AllocationActionDto {
  reason: string;
}

export interface AllocationsListResponse {
  data: FoodAllocationRecord[];
  meta: PaginationMeta;
}
