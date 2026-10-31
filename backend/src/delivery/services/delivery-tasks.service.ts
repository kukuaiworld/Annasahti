import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DELIVERY_TASK_REPOSITORY,
  IDeliveryTaskRepository,
} from '../repositories/delivery-task.repository.interface';
import { SafeChainService } from './safechain.service';
import { BatchQrService } from './batch-qr.service';
import { QuantityAccountingService } from './quantity-accounting.service';
import { DeliveryTask } from '../entities/delivery-task.entity';
import { DeliveryConfirmation } from '../entities/delivery-confirmation.entity';
import { DeliveryDiscrepancy } from '../entities/delivery-discrepancy.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { SafeChainEventType } from '../enums/safechain-event-type.enum';
import { DiscrepancyStatus, DiscrepancyType } from '../enums/discrepancy.enum';
import { TaskRejectionDto } from '../dto/task-rejection.dto';
import { PickupConfirmationDto } from '../dto/pickup-confirmation.dto';
import { PickupFailureDto } from '../dto/pickup-failure.dto';
import { DeliveryConfirmationDto } from '../dto/delivery-confirmation.dto';
import { DeliveryFailureDto } from '../dto/delivery-failure.dto';
import { ReassignTaskDto } from '../dto/reassign-task.dto';
import { DiscrepancyResolutionDto } from '../dto/discrepancy-resolution.dto';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class DeliveryTasksService {
  constructor(
    @Inject(DELIVERY_TASK_REPOSITORY)
    private readonly taskRepo: IDeliveryTaskRepository,
    private readonly safeChainService: SafeChainService,
    private readonly qrService: BatchQrService,
    private readonly accountingService: QuantityAccountingService,
  ) {}

  async getAvailableTasks(): Promise<DeliveryTask[]> {
    return this.taskRepo.findAvailableTasks();
  }

  async getMyTasks(volunteerId: string): Promise<DeliveryTask[]> {
    return this.taskRepo.findByVolunteerId(volunteerId);
  }

  async getTaskById(taskId: string, user: AuthenticatedUser): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    // Authorization: User must be assigned volunteer, platform admin, or affiliated with the task
    const isAssigned = task.volunteerId === user.id;
    const isPlatformAdmin =
      user.role === 'platform_admin' ||
      user.sessionClaims?.is_platform_reviewer === true ||
      user.sessionClaims?.role === 'admin';

    // Allow access to open available tasks or authorized actors
    if (!isAssigned && !isPlatformAdmin && task.volunteerId) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view details for this assigned delivery task.',
      );
    }

    return task;
  }

  async acceptTask(taskId: string, volunteerId: string): Promise<DeliveryTask> {
    const updated = await this.taskRepo.atomicAcceptTask(taskId, volunteerId);

    // Append-only audit trail
    await this.safeChainService.recordEvent({
      batchId: updated.batchId,
      deliveryTaskId: updated.id,
      eventType: SafeChainEventType.TASK_ACCEPTED,
      description: `Delivery task accepted by volunteer ${volunteerId}`,
      actorId: volunteerId,
      eventData: {
        taskId: updated.id,
        volunteerId,
        status: updated.status,
      },
    });

    return updated;
  }

  async rejectTask(
    taskId: string,
    volunteerId: string,
    rejectionDto: TaskRejectionDto,
  ): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    if (task.volunteerId && task.volunteerId !== volunteerId) {
      throw new ForbiddenException(
        'Access denied: You cannot reject a delivery task assigned to another volunteer.',
      );
    }

    if (
      task.status !== DeliveryStatus.ASSIGNED &&
      task.status !== DeliveryStatus.ACCEPTED
    ) {
      throw new ConflictException(
        `Cannot reject task in status "${task.status}". Only assigned or accepted tasks may be rejected.`,
      );
    }

    const now = new Date();
    const updated = await this.taskRepo.updateTask(taskId, {
      volunteerId: undefined,
      status: DeliveryStatus.ASSIGNED,
      rejectionReason: rejectionDto.reason,
      rejectedAt: now,
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: task.id,
      eventType: SafeChainEventType.TASK_REJECTED,
      description: `Task rejected by volunteer: ${rejectionDto.reason}`,
      actorId: volunteerId,
      eventData: {
        rejectionReason: rejectionDto.reason,
        previousVolunteerId: volunteerId,
      },
    });

    return updated;
  }

  async confirmPickup(
    taskId: string,
    volunteerId: string,
    pickupDto: PickupConfirmationDto,
  ): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    if (task.volunteerId !== volunteerId) {
      throw new ForbiddenException(
        'Access denied: Only the assigned volunteer can confirm food pickup for this task.',
      );
    }

    if (
      task.status !== DeliveryStatus.ACCEPTED &&
      task.status !== DeliveryStatus.ASSIGNED
    ) {
      throw new ConflictException(
        `Invalid task state for pickup: Current status is "${task.status}" (must be "accepted").`,
      );
    }

    // Cryptographic and server-side QR verification
    const qr = await this.qrService.resolveQrToken(pickupDto.qrToken);
    if (qr.batchId !== task.batchId) {
      throw new BadRequestException(
        'QR verification failure: Scanned QR token does not belong to the batch for this delivery task.',
      );
    }

    // Unit verification
    if (pickupDto.quantityUnit.trim().toLowerCase() !== task.quantityUnit.trim().toLowerCase()) {
      throw new BadRequestException(
        `Quantity unit mismatch: Task allocation is in "${task.quantityUnit}", pickup was submitted in "${pickupDto.quantityUnit}".`,
      );
    }

    // Discrepancy calculation at collection
    const isDiscrepancy = pickupDto.collectedQuantity !== task.allocatedQuantity;
    if (isDiscrepancy) {
      const discrepancyQty = Number(
        Math.abs(task.allocatedQuantity - pickupDto.collectedQuantity).toFixed(3),
      );
      const discrepancyType =
        pickupDto.collectedQuantity < task.allocatedQuantity
          ? DiscrepancyType.SHORT_PICKUP
          : DiscrepancyType.EXCESS_PICKUP;

      await this.taskRepo.createDiscrepancy({
        deliveryTaskId: taskId,
        batchId: task.batchId,
        type: discrepancyType,
        status: DiscrepancyStatus.REPORTED,
        allocatedQuantity: task.allocatedQuantity,
        collectedQuantity: pickupDto.collectedQuantity,
        receivedQuantity: 0,
        discrepancyQuantity: discrepancyQty,
        quantityUnit: task.quantityUnit,
        reportedBy: volunteerId,
        evidenceUrls: pickupDto.evidenceUrls || [],
      });

      await this.safeChainService.recordEvent({
        batchId: task.batchId,
        deliveryTaskId: taskId,
        eventType: SafeChainEventType.QUANTITY_DISCREPANCY_REPORTED,
        description: `Pickup quantity discrepancy detected: Allocated ${task.allocatedQuantity} ${task.quantityUnit}, Collected ${pickupDto.collectedQuantity} ${task.quantityUnit}`,
        actorId: volunteerId,
        eventData: {
          allocatedQuantity: task.allocatedQuantity,
          collectedQuantity: pickupDto.collectedQuantity,
          discrepancyQuantity: discrepancyQty,
          type: discrepancyType,
        },
      });
    }

    const now = new Date();
    const updated = await this.taskRepo.updateTask(taskId, {
      status: DeliveryStatus.PICKUP_CONFIRMED,
      pickupConfirmedAt: now,
      departedAt: now,
      collectedQuantity: pickupDto.collectedQuantity,
      pickupTemperatureC: pickupDto.temperatureC,
      pickupHandlingNotes: pickupDto.handlingNotes,
      pickupEvidenceUrls: pickupDto.evidenceUrls || [],
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.PICKUP_CONFIRMED,
      description: `Food collected by volunteer. Quantity: ${pickupDto.collectedQuantity} ${task.quantityUnit}`,
      actorId: volunteerId,
      eventData: {
        collectedQuantity: pickupDto.collectedQuantity,
        quantityUnit: task.quantityUnit,
        temperatureC: pickupDto.temperatureC,
        qrTokenVerified: true,
      },
    });

    // Automatically transition to in_transit
    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.IN_TRANSIT,
      description: `Delivery departed pickup point, currently in transit to recipient.`,
      actorId: volunteerId,
    });

    return updated;
  }

  async reportPickupFailure(
    taskId: string,
    volunteerId: string,
    failureDto: PickupFailureDto,
  ): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    if (task.volunteerId !== volunteerId) {
      throw new ForbiddenException(
        'Access denied: Only the assigned volunteer can report pickup failure.',
      );
    }

    const now = new Date();
    const updated = await this.taskRepo.updateTask(taskId, {
      status: DeliveryStatus.FAILED,
      failureReason: failureDto.reason,
      failedAt: now,
      deliveryNotes: failureDto.notes,
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.PICKUP_FAILED,
      description: `Pickup failed: ${failureDto.reason}`,
      actorId: volunteerId,
      eventData: {
        reason: failureDto.reason,
        notes: failureDto.notes,
        evidenceUrls: failureDto.evidenceUrls || [],
      },
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.DELIVERY_FAILED,
      description: `Task terminated with status failed following pickup failure.`,
      actorId: volunteerId,
    });

    return updated;
  }

  async confirmDelivery(
    taskId: string,
    recipientUserId: string,
    deliveryDto: DeliveryConfirmationDto,
  ): Promise<DeliveryConfirmation> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    // Role safety: The volunteer cannot impersonate the recipient to approve their own delivery!
    if (task.volunteerId === recipientUserId) {
      throw new ForbiddenException(
        'Security Violation: Volunteers cannot confirm delivery receipt. Delivery receipt must be confirmed by an authorized recipient organisation representative.',
      );
    }

    // Task state check: Must be picked up before delivery can be confirmed
    if (
      task.status !== DeliveryStatus.PICKUP_CONFIRMED &&
      task.status !== DeliveryStatus.IN_TRANSIT
    ) {
      throw new ConflictException(
        `Cannot confirm delivery: Task status is "${task.status}" (food must be picked up and in transit first).`,
      );
    }

    // Check duplicate confirmation
    const existingConf = await this.taskRepo.findConfirmationByTaskId(taskId);
    if (existingConf) {
      throw new ConflictException(
        `Delivery confirmation has already been recorded for delivery task ${taskId}.`,
      );
    }

    // Authoritative Quantity Accounting
    const collectedQty = task.collectedQuantity ?? task.allocatedQuantity;
    const reconciliation = this.accountingService.reconcileQuantities({
      allocatedQuantity: task.allocatedQuantity,
      collectedQuantity: collectedQty,
      receivedQuantity: deliveryDto.receivedQuantity,
      allocatedUnit: task.quantityUnit,
      collectedUnit: task.quantityUnit,
      receivedUnit: deliveryDto.quantityUnit,
    });

    // Partial delivery & discrepancy handling
    if (reconciliation.isPartialDelivery) {
      await this.taskRepo.createDiscrepancy({
        deliveryTaskId: taskId,
        batchId: task.batchId,
        type: DiscrepancyType.MISSING_UNACCOUNTED,
        status: DiscrepancyStatus.REPORTED,
        allocatedQuantity: task.allocatedQuantity,
        collectedQuantity: collectedQty,
        receivedQuantity: deliveryDto.receivedQuantity,
        discrepancyQuantity: reconciliation.discrepancyQuantity,
        quantityUnit: task.quantityUnit,
        reportedBy: recipientUserId,
        evidenceUrls: deliveryDto.evidenceUrls || [],
      });

      await this.safeChainService.recordEvent({
        batchId: task.batchId,
        deliveryTaskId: taskId,
        eventType: SafeChainEventType.PARTIAL_DELIVERY_CONFIRMED,
        description: `Partial delivery confirmed: Received ${deliveryDto.receivedQuantity} ${task.quantityUnit} of ${collectedQty} ${task.quantityUnit} collected. Missing quantity: ${reconciliation.discrepancyQuantity} ${task.quantityUnit}.`,
        actorId: recipientUserId,
        eventData: {
          allocatedQuantity: task.allocatedQuantity,
          collectedQuantity: collectedQty,
          receivedQuantity: deliveryDto.receivedQuantity,
          missingQuantity: reconciliation.discrepancyQuantity,
        },
      });
    }

    // Save DeliveryConfirmation record
    const now = new Date();
    const confirmation = await this.taskRepo.createConfirmation({
      deliveryTaskId: taskId,
      confirmedBy: recipientUserId,
      receivedQuantity: deliveryDto.receivedQuantity,
      quantityUnit: deliveryDto.quantityUnit,
      recipientNotes: deliveryDto.recipientNotes,
      evidenceUrls: deliveryDto.evidenceUrls || [],
      confirmedAt: now,
    });

    // Update delivery task to delivered
    await this.taskRepo.updateTask(taskId, {
      status: DeliveryStatus.DELIVERED,
      deliveredAt: now,
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.DELIVERED,
      description: `Delivery completed and verified by recipient. Received: ${deliveryDto.receivedQuantity} ${task.quantityUnit}`,
      actorId: recipientUserId,
      eventData: {
        receivedQuantity: deliveryDto.receivedQuantity,
        quantityUnit: task.quantityUnit,
        isPartial: reconciliation.isPartialDelivery,
      },
    });

    return confirmation;
  }

  async reportDeliveryFailure(
    taskId: string,
    failureDto: DeliveryFailureDto,
    reporterUserId: string,
  ): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    const now = new Date();
    const updated = await this.taskRepo.updateTask(taskId, {
      status: DeliveryStatus.FAILED,
      failureReason: failureDto.reason,
      failedAt: now,
      deliveryNotes: failureDto.notes,
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.DELIVERY_FAILED,
      description: `Delivery failed during transit/delivery: ${failureDto.reason}`,
      actorId: reporterUserId,
      eventData: {
        reason: failureDto.reason,
        notes: failureDto.notes,
        evidenceUrls: failureDto.evidenceUrls || [],
      },
    });

    return updated;
  }

  async reassignTask(
    taskId: string,
    reassignDto: ReassignTaskDto,
    adminUserId: string,
  ): Promise<DeliveryTask> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundException(`Delivery task ${taskId} not found`);
    }

    const now = new Date();
    const updated = await this.taskRepo.updateTask(taskId, {
      volunteerId: reassignDto.volunteerId,
      status: DeliveryStatus.ASSIGNED,
      assignedAt: now,
      acceptedAt: undefined,
      pickupConfirmedAt: undefined,
      departedAt: undefined,
      failureReason: undefined,
      failedAt: undefined,
    });

    await this.safeChainService.recordEvent({
      batchId: task.batchId,
      deliveryTaskId: taskId,
      eventType: SafeChainEventType.TASK_REASSIGNED,
      description: `Task administratively reassigned to volunteer ${reassignDto.volunteerId}. Reason: ${reassignDto.reason || 'Administrative action'}`,
      actorId: adminUserId,
      eventData: {
        newVolunteerId: reassignDto.volunteerId,
        previousVolunteerId: task.volunteerId,
        reason: reassignDto.reason,
      },
    });

    return updated;
  }

  async getDiscrepancies(taskId: string): Promise<DeliveryDiscrepancy[]> {
    return this.taskRepo.findDiscrepanciesByTaskId(taskId);
  }

  async resolveDiscrepancy(
    discrepancyId: string,
    resolutionDto: DiscrepancyResolutionDto,
    adminUserId: string,
  ): Promise<DeliveryDiscrepancy> {
    const discrepancy = await this.taskRepo.findDiscrepancyById(discrepancyId);
    if (!discrepancy) {
      throw new NotFoundException(`Discrepancy with ID ${discrepancyId} not found`);
    }

    const now = new Date();
    const updated = await this.taskRepo.updateDiscrepancy(discrepancyId, {
      status: resolutionDto.status,
      resolutionNotes: resolutionDto.resolutionNotes,
      resolvedBy: adminUserId,
      resolvedAt: now,
    });

    await this.safeChainService.recordEvent({
      batchId: discrepancy.batchId,
      deliveryTaskId: discrepancy.deliveryTaskId,
      eventType: SafeChainEventType.DISCREPANCY_RESOLVED,
      description: `Discrepancy resolved by administrator. Notes: ${resolutionDto.resolutionNotes}`,
      actorId: adminUserId,
      eventData: {
        discrepancyId,
        status: resolutionDto.status,
        resolutionNotes: resolutionDto.resolutionNotes,
      },
    });

    return updated;
  }
}
