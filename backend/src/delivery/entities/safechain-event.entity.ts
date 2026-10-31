import { SafeChainEventType } from '../enums/safechain-event-type.enum';

export class SafeChainEvent {
  id: string;
  batchId: string;
  allocationId?: string;
  deliveryTaskId?: string;
  eventType: SafeChainEventType;
  description?: string;
  actorId?: string;
  eventData: Record<string, unknown>;
  recordedAt: Date;
  createdAt: Date;
}
