export enum SafeChainEventType {
  // Database approved safechain_events types:
  BATCH_CREATED = 'batch_created',
  INSPECTION_COMPLETED = 'inspection_completed',
  BATCH_APPROVED = 'batch_approved',
  BATCH_REJECTED = 'batch_rejected',
  ALLOCATION_CREATED = 'allocation_created',
  ALLOCATION_ACCEPTED = 'allocation_accepted',
  PICKUP_CONFIRMED = 'pickup_confirmed',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  WASTE_PROCESSED = 'waste_processed',

  // Operational delivery lifecycle events (logged in batch_events & domain stream):
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_ACCEPTED = 'task_accepted',
  TASK_REJECTED = 'task_rejected',
  TASK_CANCELLED = 'task_cancelled',
  TASK_REASSIGNED = 'task_reassigned',
  PICKUP_FAILED = 'pickup_failed',
  PARTIAL_DELIVERY_CONFIRMED = 'partial_delivery_confirmed',
  QUANTITY_DISCREPANCY_REPORTED = 'quantity_discrepancy_reported',
  DISCREPANCY_RESOLVED = 'discrepancy_resolved',
}
