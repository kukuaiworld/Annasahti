import { Inject, Injectable } from '@nestjs/common';
import {
  ISafeChainEventRepository,
  SAFECHAIN_EVENT_REPOSITORY,
} from '../repositories/safechain-event.repository.interface';
import { SafeChainEvent } from '../entities/safechain-event.entity';
import { SafeChainEventType } from '../enums/safechain-event-type.enum';

@Injectable()
export class SafeChainService {
  constructor(
    @Inject(SAFECHAIN_EVENT_REPOSITORY)
    private readonly eventRepo: ISafeChainEventRepository,
  ) {}

  async recordEvent(params: {
    batchId: string;
    eventType: SafeChainEventType;
    description?: string;
    actorId?: string;
    deliveryTaskId?: string;
    allocationId?: string;
    eventData?: Record<string, unknown>;
  }): Promise<SafeChainEvent> {
    return this.eventRepo.recordEvent({
      batchId: params.batchId,
      eventType: params.eventType,
      description: params.description,
      actorId: params.actorId,
      deliveryTaskId: params.deliveryTaskId,
      allocationId: params.allocationId,
      eventData: params.eventData || {},
      recordedAt: new Date(),
    });
  }

  async getEventsByBatch(batchId: string): Promise<SafeChainEvent[]> {
    return this.eventRepo.findEventsByBatchId(batchId);
  }

  async getEventsByTask(taskId: string): Promise<SafeChainEvent[]> {
    return this.eventRepo.findEventsByTaskId(taskId);
  }
}
