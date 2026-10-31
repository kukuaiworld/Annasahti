import { DiscrepancyType, DiscrepancyStatus } from '../enums/discrepancy.enum';

export class DeliveryDiscrepancy {
  id: string;
  deliveryTaskId: string;
  batchId: string;
  type: DiscrepancyType;
  status: DiscrepancyStatus;
  allocatedQuantity: number;
  collectedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  quantityUnit: string;
  reportedBy: string;
  reportedAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  evidenceUrls?: string[];
}
