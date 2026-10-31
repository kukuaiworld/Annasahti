export class DeliveryConfirmation {
  id: string;
  deliveryTaskId: string;
  confirmedBy: string; // Recipient organisation member UUID
  receivedQuantity: number;
  quantityUnit: string;
  recipientNotes?: string;
  evidenceUrls: string[];
  confirmedAt: Date;
  createdAt: Date;
}
