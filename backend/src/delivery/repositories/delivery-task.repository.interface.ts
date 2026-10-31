import { DeliveryTask } from '../entities/delivery-task.entity';
import { DeliveryConfirmation } from '../entities/delivery-confirmation.entity';
import { DeliveryDiscrepancy } from '../entities/delivery-discrepancy.entity';
import { BatchQrCode } from '../entities/batch-qr-code.entity';

export interface IDeliveryTaskRepository {
  createTask(task: Partial<DeliveryTask>): Promise<DeliveryTask>;
  findById(id: string): Promise<DeliveryTask | null>;
  findAvailableTasks(): Promise<DeliveryTask[]>;
  findByVolunteerId(volunteerId: string): Promise<DeliveryTask[]>;
  updateTask(id: string, updates: Partial<DeliveryTask>): Promise<DeliveryTask>;
  atomicAcceptTask(taskId: string, volunteerId: string): Promise<DeliveryTask>;

  // Confirmations
  createConfirmation(conf: Partial<DeliveryConfirmation>): Promise<DeliveryConfirmation>;
  findConfirmationByTaskId(taskId: string): Promise<DeliveryConfirmation | null>;

  // Discrepancies
  createDiscrepancy(disc: Partial<DeliveryDiscrepancy>): Promise<DeliveryDiscrepancy>;
  findDiscrepanciesByTaskId(taskId: string): Promise<DeliveryDiscrepancy[]>;
  findDiscrepancyById(id: string): Promise<DeliveryDiscrepancy | null>;
  updateDiscrepancy(id: string, updates: Partial<DeliveryDiscrepancy>): Promise<DeliveryDiscrepancy>;

  // QR Codes
  findQrCodeByBatchId(batchId: string): Promise<BatchQrCode | null>;
  findQrCodeByToken(qrToken: string): Promise<BatchQrCode | null>;
  createQrCode(batchId: string, qrToken?: string): Promise<BatchQrCode>;
  revokeQrCode(qrToken: string): Promise<BatchQrCode>;
}

export const DELIVERY_TASK_REPOSITORY = Symbol('IDeliveryTaskRepository');
