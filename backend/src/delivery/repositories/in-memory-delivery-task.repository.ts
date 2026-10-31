import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IDeliveryTaskRepository } from './delivery-task.repository.interface';
import { DeliveryTask } from '../entities/delivery-task.entity';
import { DeliveryConfirmation } from '../entities/delivery-confirmation.entity';
import { DeliveryDiscrepancy } from '../entities/delivery-discrepancy.entity';
import { BatchQrCode } from '../entities/batch-qr-code.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Injectable()
export class InMemoryDeliveryTaskRepository implements IDeliveryTaskRepository {
  private readonly tasks = new Map<string, DeliveryTask>();
  private readonly confirmations = new Map<string, DeliveryConfirmation>();
  private readonly discrepancies = new Map<string, DeliveryDiscrepancy>();
  private readonly qrCodes = new Map<string, BatchQrCode>(); // key: qrToken

  async createTask(task: Partial<DeliveryTask>): Promise<DeliveryTask> {
    const id = task.id || randomUUID();
    const now = new Date();
    const entity: DeliveryTask = {
      id,
      allocationId: task.allocationId || randomUUID(),
      volunteerId: task.volunteerId,
      status: task.status || DeliveryStatus.ASSIGNED,
      pickupDeadline: task.pickupDeadline,
      deliveryDeadline: task.deliveryDeadline,
      assignedAt: task.assignedAt || now,
      acceptedAt: task.acceptedAt,
      pickupConfirmedAt: task.pickupConfirmedAt,
      departedAt: task.departedAt,
      deliveredAt: task.deliveredAt,
      deliveryNotes: task.deliveryNotes,
      batchId: task.batchId || randomUUID(),
      donorOrganisationId: task.donorOrganisationId || randomUUID(),
      recipientOrganisationId: task.recipientOrganisationId || randomUUID(),
      foodName: task.foodName || 'Surplus Meals',
      foodCategory: task.foodCategory || 'human_consumption',
      allocatedQuantity: task.allocatedQuantity || 10,
      quantityUnit: task.quantityUnit || 'kg',
      pickupAddress: task.pickupAddress,
      dropoffAddress: task.dropoffAddress,
      collectedQuantity: task.collectedQuantity,
      pickupEvidenceUrls: task.pickupEvidenceUrls || [],
      pickupTemperatureC: task.pickupTemperatureC,
      pickupHandlingNotes: task.pickupHandlingNotes,
      failureReason: task.failureReason,
      failedAt: task.failedAt,
      rejectionReason: task.rejectionReason,
      rejectedAt: task.rejectedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<DeliveryTask | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async findAvailableTasks(): Promise<DeliveryTask[]> {
    const result: DeliveryTask[] = [];
    for (const task of this.tasks.values()) {
      // Available means status is ASSIGNED and either unassigned or awaiting acceptance
      if (task.status === DeliveryStatus.ASSIGNED && !task.volunteerId) {
        result.push({ ...task });
      }
    }
    return result;
  }

  async findByVolunteerId(volunteerId: string): Promise<DeliveryTask[]> {
    const result: DeliveryTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.volunteerId === volunteerId) {
        result.push({ ...task });
      }
    }
    return result;
  }

  async updateTask(id: string, updates: Partial<DeliveryTask>): Promise<DeliveryTask> {
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new NotFoundException(`Delivery task ${id} not found`);
    }

    const updated: DeliveryTask = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return { ...updated };
  }

  /**
   * Concurrency-safe atomic assignment & acceptance.
   * Equivalent to:
   * UPDATE delivery_tasks
   * SET status = 'accepted', volunteer_id = :volunteerId, accepted_at = now()
   * WHERE id = :id AND status = 'assigned' AND (volunteer_id IS NULL OR volunteer_id = :volunteerId);
   */
  async atomicAcceptTask(taskId: string, volunteerId: string): Promise<DeliveryTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    if (task.status !== DeliveryStatus.ASSIGNED) {
      throw new ConflictException(
        `Task cannot be accepted: Current status is "${task.status}" (must be "assigned")`,
      );
    }

    if (task.volunteerId && task.volunteerId !== volunteerId) {
      throw new ConflictException(
        'Task is already assigned to another volunteer and cannot be accepted.',
      );
    }

    const now = new Date();
    const updated: DeliveryTask = {
      ...task,
      status: DeliveryStatus.ACCEPTED,
      volunteerId,
      acceptedAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, updated);
    return { ...updated };
  }

  async createConfirmation(conf: Partial<DeliveryConfirmation>): Promise<DeliveryConfirmation> {
    const id = conf.id || randomUUID();
    const now = new Date();
    const entity: DeliveryConfirmation = {
      id,
      deliveryTaskId: conf.deliveryTaskId!,
      confirmedBy: conf.confirmedBy!,
      receivedQuantity: conf.receivedQuantity!,
      quantityUnit: conf.quantityUnit!,
      recipientNotes: conf.recipientNotes,
      evidenceUrls: conf.evidenceUrls || [],
      confirmedAt: conf.confirmedAt || now,
      createdAt: now,
    };
    this.confirmations.set(entity.deliveryTaskId, entity);
    return { ...entity };
  }

  async findConfirmationByTaskId(taskId: string): Promise<DeliveryConfirmation | null> {
    const conf = this.confirmations.get(taskId);
    return conf ? { ...conf } : null;
  }

  async createDiscrepancy(disc: Partial<DeliveryDiscrepancy>): Promise<DeliveryDiscrepancy> {
    const id = disc.id || randomUUID();
    const now = new Date();
    const entity: DeliveryDiscrepancy = {
      id,
      deliveryTaskId: disc.deliveryTaskId!,
      batchId: disc.batchId!,
      type: disc.type!,
      status: disc.status!,
      allocatedQuantity: disc.allocatedQuantity!,
      collectedQuantity: disc.collectedQuantity!,
      receivedQuantity: disc.receivedQuantity!,
      discrepancyQuantity: disc.discrepancyQuantity!,
      quantityUnit: disc.quantityUnit!,
      reportedBy: disc.reportedBy!,
      reportedAt: disc.reportedAt || now,
      resolvedBy: disc.resolvedBy,
      resolvedAt: disc.resolvedAt,
      resolutionNotes: disc.resolutionNotes,
      evidenceUrls: disc.evidenceUrls || [],
    };
    this.discrepancies.set(id, entity);
    return { ...entity };
  }

  async findDiscrepanciesByTaskId(taskId: string): Promise<DeliveryDiscrepancy[]> {
    const result: DeliveryDiscrepancy[] = [];
    for (const d of this.discrepancies.values()) {
      if (d.deliveryTaskId === taskId) {
        result.push({ ...d });
      }
    }
    return result;
  }

  async findDiscrepancyById(id: string): Promise<DeliveryDiscrepancy | null> {
    const d = this.discrepancies.get(id);
    return d ? { ...d } : null;
  }

  async updateDiscrepancy(
    id: string,
    updates: Partial<DeliveryDiscrepancy>,
  ): Promise<DeliveryDiscrepancy> {
    const existing = this.discrepancies.get(id);
    if (!existing) {
      throw new NotFoundException(`Discrepancy ${id} not found`);
    }

    const updated: DeliveryDiscrepancy = {
      ...existing,
      ...updates,
      id: existing.id,
    };
    this.discrepancies.set(id, updated);
    return { ...updated };
  }

  async findQrCodeByBatchId(batchId: string): Promise<BatchQrCode | null> {
    for (const qr of this.qrCodes.values()) {
      if (qr.batchId === batchId && qr.isActive) {
        return { ...qr };
      }
    }
    return null;
  }

  async findQrCodeByToken(qrToken: string): Promise<BatchQrCode | null> {
    const qr = this.qrCodes.get(qrToken);
    return qr ? { ...qr } : null;
  }

  async createQrCode(batchId: string, customToken?: string): Promise<BatchQrCode> {
    // Revoke any existing active token for this batch (1:1 constraint)
    for (const [token, qr] of this.qrCodes.entries()) {
      if (qr.batchId === batchId && qr.isActive) {
        this.qrCodes.set(token, { ...qr, isActive: false, revokedAt: new Date() });
      }
    }

    const id = randomUUID();
    const qrToken = customToken || randomUUID();
    const entity: BatchQrCode = {
      id,
      batchId,
      qrToken,
      isActive: true,
      createdAt: new Date(),
    };
    this.qrCodes.set(qrToken, entity);
    return { ...entity };
  }

  async revokeQrCode(qrToken: string): Promise<BatchQrCode> {
    const qr = this.qrCodes.get(qrToken);
    if (!qr) {
      throw new NotFoundException(`QR Code token ${qrToken} not found`);
    }

    const revoked: BatchQrCode = {
      ...qr,
      isActive: false,
      revokedAt: new Date(),
    };
    this.qrCodes.set(qrToken, revoked);
    return { ...revoked };
  }

  clear(): void {
    this.tasks.clear();
    this.confirmations.clear();
    this.discrepancies.clear();
    this.qrCodes.clear();
  }
}
