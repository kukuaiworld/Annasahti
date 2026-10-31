import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ISafeChainEventRepository } from './safechain-event.repository.interface';
import { SafeChainEvent } from '../entities/safechain-event.entity';

@Injectable()
export class InMemorySafeChainEventRepository implements ISafeChainEventRepository {
  private readonly events: SafeChainEvent[] = [];

  async recordEvent(event: Partial<SafeChainEvent>): Promise<SafeChainEvent> {
    const id = event.id || randomUUID();
    const now = new Date();
    const entity: SafeChainEvent = {
      id,
      batchId: event.batchId!,
      allocationId: event.allocationId,
      deliveryTaskId: event.deliveryTaskId,
      eventType: event.eventType!,
      description: event.description,
      actorId: event.actorId,
      eventData: event.eventData || {},
      recordedAt: event.recordedAt || now,
      createdAt: now,
    };
    // Append-only: push to array, never mutate historical records
    this.events.push(entity);
    return { ...entity };
  }

  async findEventsByBatchId(batchId: string): Promise<SafeChainEvent[]> {
    return this.events
      .filter((e) => e.batchId === batchId)
      .map((e) => ({ ...e }));
  }

  async findEventsByTaskId(taskId: string): Promise<SafeChainEvent[]> {
    return this.events
      .filter((e) => e.deliveryTaskId === taskId)
      .map((e) => ({ ...e }));
  }

  clear(): void {
    this.events.length = 0;
  }
}
