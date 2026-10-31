import { SafeChainEvent } from '../entities/safechain-event.entity';

export interface ISafeChainEventRepository {
  recordEvent(event: Partial<SafeChainEvent>): Promise<SafeChainEvent>;
  findEventsByBatchId(batchId: string): Promise<SafeChainEvent[]>;
  findEventsByTaskId(taskId: string): Promise<SafeChainEvent[]>;
}

export const SAFECHAIN_EVENT_REPOSITORY = Symbol('ISafeChainEventRepository');
