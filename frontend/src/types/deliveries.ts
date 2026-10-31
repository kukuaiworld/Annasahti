import { PaginationMeta } from './api';

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  PICKUP_CONFIRMED = 'pickup_confirmed',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DISCREPANCY_REPORTED = 'discrepancy_reported',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface DeliveryTaskRecord {
  id: string;
  allocation_id: string;
  volunteer_id?: string | null;
  status: DeliveryStatus | string;
  pickup_deadline?: string;
  delivery_deadline?: string;
  pickup_confirmed_at?: string;
  departed_at?: string;
  delivered_at?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  batch_id?: string;
  allocated_quantity?: number;
  quantity_unit?: string;
  food_name?: string;
  batch_code?: string;
  storage_instructions?: string;
  donor_name?: string;
  donor_address?: string;
  recipient_name?: string;
  recipient_address?: string;
  volunteer_name?: string;
  volunteer_phone?: string | null;
  confirmation_id?: string;
  received_quantity?: number;
  damaged_quantity?: number;
  missing_quantity?: number;
  confirmed_at?: string;
  recipient_notes?: string;
}

export interface CompleteDeliveryDto {
  receivedQuantity: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  quantityUnit: string;
  discrepancyReason?: string;
  canBeDivertedToWaste?: boolean;
  recipientNotes?: string;
  evidenceUrls?: string[];
}

export interface PickupDeliveryDto {
  pickupNotes?: string;
}

export interface AssignVolunteerDto {
  volunteerId: string;
  pickupDeadline?: string;
  deliveryDeadline?: string;
  deliveryNotes?: string;
}

export interface DeliveryQueryDto {
  page?: number;
  limit?: number;
  status?: DeliveryStatus | string;
  volunteerId?: string;
  allocationId?: string;
}

export interface DeliveriesListResponse {
  data: DeliveryTaskRecord[];
  meta: PaginationMeta;
}
