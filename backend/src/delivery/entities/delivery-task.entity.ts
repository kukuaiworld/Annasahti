import { DeliveryStatus } from '../enums/delivery-status.enum';

export class DeliveryTask {
  id: string;
  allocationId: string;
  volunteerId?: string;
  status: DeliveryStatus;
  pickupDeadline?: Date;
  deliveryDeadline?: Date;
  assignedAt: Date;
  acceptedAt?: Date;
  pickupConfirmedAt?: Date;
  departedAt?: Date;
  deliveredAt?: Date;
  deliveryNotes?: string;

  // Associated batch and organisation context
  batchId: string;
  donorOrganisationId: string;
  recipientOrganisationId: string;
  foodName: string;
  foodCategory: string;
  allocatedQuantity: number;
  quantityUnit: string;
  pickupAddress?: string;
  dropoffAddress?: string;

  // Physical collection tracking
  collectedQuantity?: number;
  pickupEvidenceUrls?: string[];
  pickupTemperatureC?: number;
  pickupHandlingNotes?: string;

  // Failure & rejection tracking
  failureReason?: string;
  failedAt?: Date;
  rejectionReason?: string;
  rejectedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
