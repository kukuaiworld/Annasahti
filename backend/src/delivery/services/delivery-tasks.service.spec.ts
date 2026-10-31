import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryTasksService } from './delivery-tasks.service';
import { SafeChainService } from './safechain.service';
import { BatchQrService } from './batch-qr.service';
import { QuantityAccountingService } from './quantity-accounting.service';
import { InMemoryDeliveryTaskRepository } from '../repositories/in-memory-delivery-task.repository';
import { InMemorySafeChainEventRepository } from '../repositories/in-memory-safechain-event.repository';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { SafeChainEventType } from '../enums/safechain-event-type.enum';
import { DiscrepancyStatus, DiscrepancyType } from '../enums/discrepancy.enum';
import { DeliveryTask } from '../entities/delivery-task.entity';

describe('DeliveryTasksService', () => {
  let service: DeliveryTasksService;
  let taskRepo: InMemoryDeliveryTaskRepository;
  let eventRepo: InMemorySafeChainEventRepository;
  let safeChainService: SafeChainService;
  let qrService: BatchQrService;
  let accountingService: QuantityAccountingService;

  let sampleTask: DeliveryTask;
  let sampleQrToken: string;

  const volunteerA = 'volunteer-0001-uuid';
  const volunteerB = 'volunteer-0002-uuid';
  const recipientUser = 'recipient-0001-uuid';
  const adminUser = 'admin-0001-uuid';

  beforeEach(async () => {
    taskRepo = new InMemoryDeliveryTaskRepository();
    eventRepo = new InMemorySafeChainEventRepository();
    safeChainService = new SafeChainService(eventRepo);
    qrService = new BatchQrService(taskRepo);
    accountingService = new QuantityAccountingService();

    service = new DeliveryTasksService(
      taskRepo,
      safeChainService,
      qrService,
      accountingService,
    );

    sampleTask = await taskRepo.createTask({
      allocatedQuantity: 50,
      quantityUnit: 'kg',
      foodName: 'Surplus Fresh Rice and Curry',
      foodCategory: 'human_consumption',
      status: DeliveryStatus.ASSIGNED,
    });

    const qr = await qrService.generateOrGetQr(sampleTask.batchId);
    sampleQrToken = qr.qrToken;
  });

  describe('Task Acceptance & Concurrency Safety', () => {
    it('should allow volunteer to accept available task and log SafeChain event', async () => {
      const accepted = await service.acceptTask(sampleTask.id, volunteerA);

      expect(accepted.status).toBe(DeliveryStatus.ACCEPTED);
      expect(accepted.volunteerId).toBe(volunteerA);
      expect(accepted.acceptedAt).toBeDefined();

      const events = await safeChainService.getEventsByTask(sampleTask.id);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(SafeChainEventType.TASK_ACCEPTED);
      expect(events[0].actorId).toBe(volunteerA);
    });

    it('CONCURRENCY: should strictly prevent two volunteers from accepting the same task', async () => {
      // First volunteer accepts
      await service.acceptTask(sampleTask.id, volunteerA);

      // Second volunteer attempts to accept concurrently
      await expect(
        service.acceptTask(sampleTask.id, volunteerB),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Task Rejection', () => {
    it('should allow assigned volunteer to reject task with mandatory reason', async () => {
      await service.acceptTask(sampleTask.id, volunteerA);

      const rejected = await service.rejectTask(sampleTask.id, volunteerA, {
        reason: 'Emergency hospital visit, cannot complete delivery route',
      });

      expect(rejected.status).toBe(DeliveryStatus.ASSIGNED);
      expect(rejected.volunteerId).toBeUndefined();
      expect(rejected.rejectionReason).toContain('Emergency hospital visit');

      const events = await safeChainService.getEventsByTask(sampleTask.id);
      const rejEvent = events.find((e) => e.eventType === SafeChainEventType.TASK_REJECTED);
      expect(rejEvent).toBeDefined();
    });

    it('should prevent an unauthorized volunteer from rejecting another volunteer task', async () => {
      await service.acceptTask(sampleTask.id, volunteerA);

      await expect(
        service.rejectTask(sampleTask.id, volunteerB, {
          reason: 'I want to cancel his task',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Pickup Confirmation & QR Validation', () => {
    beforeEach(async () => {
      await service.acceptTask(sampleTask.id, volunteerA);
    });

    it('should confirm food pickup with valid QR scan and transition task to in_transit', async () => {
      const pickedUp = await service.confirmPickup(sampleTask.id, volunteerA, {
        qrToken: sampleQrToken,
        collectedQuantity: 50,
        quantityUnit: 'kg',
        temperatureC: 4.0,
        handlingNotes: 'Maintained cold chain inside insulated carriers',
      });

      expect(pickedUp.status).toBe(DeliveryStatus.PICKUP_CONFIRMED);
      expect(pickedUp.collectedQuantity).toBe(50);
      expect(pickedUp.pickupConfirmedAt).toBeDefined();

      const events = await safeChainService.getEventsByTask(sampleTask.id);
      expect(events.some((e) => e.eventType === SafeChainEventType.PICKUP_CONFIRMED)).toBe(true);
      expect(events.some((e) => e.eventType === SafeChainEventType.IN_TRANSIT)).toBe(true);
    });

    it('SECURITY: should reject pickup if scanned QR belongs to a different batch', async () => {
      const otherBatchQr = await qrService.generateOrGetQr('unrelated-batch-id');

      await expect(
        service.confirmPickup(sampleTask.id, volunteerA, {
          qrToken: otherBatchQr.qrToken,
          collectedQuantity: 50,
          quantityUnit: 'kg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record quantity discrepancy when collected quantity differs from allocation', async () => {
      await service.confirmPickup(sampleTask.id, volunteerA, {
        qrToken: sampleQrToken,
        collectedQuantity: 45, // Short by 5 kg
        quantityUnit: 'kg',
      });

      const discrepancies = await service.getDiscrepancies(sampleTask.id);
      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].type).toBe(DiscrepancyType.SHORT_PICKUP);
      expect(discrepancies[0].discrepancyQuantity).toBe(5);
    });
  });

  describe('Delivery Confirmation & Partial Delivery Accounting', () => {
    beforeEach(async () => {
      await service.acceptTask(sampleTask.id, volunteerA);
      await service.confirmPickup(sampleTask.id, volunteerA, {
        qrToken: sampleQrToken,
        collectedQuantity: 50,
        quantityUnit: 'kg',
      });
    });

    it('SECURITY: should strictly forbid the volunteer from confirming their own delivery', async () => {
      await expect(
        service.confirmDelivery(sampleTask.id, volunteerA, {
          receivedQuantity: 50,
          quantityUnit: 'kg',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CRITICAL: should support partial delivery, preserve independent quantities, and log discrepancy', async () => {
      // Picked up: 50 kg, Recipient receives: 42 kg -> 8 kg missing
      const conf = await service.confirmDelivery(sampleTask.id, recipientUser, {
        receivedQuantity: 42,
        quantityUnit: 'kg',
        recipientNotes: 'Delivered in good condition but 8 kg missing due to transit leak',
      });

      expect(conf.receivedQuantity).toBe(42);
      expect(conf.confirmedBy).toBe(recipientUser);

      const task = await taskRepo.findById(sampleTask.id);
      expect(task?.status).toBe(DeliveryStatus.DELIVERED);
      // Ensure allocated and collected quantities were NOT overwritten!
      expect(task?.allocatedQuantity).toBe(50);
      expect(task?.collectedQuantity).toBe(50);

      const discrepancies = await service.getDiscrepancies(sampleTask.id);
      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].type).toBe(DiscrepancyType.MISSING_UNACCOUNTED);
      expect(discrepancies[0].discrepancyQuantity).toBe(8);

      const events = await safeChainService.getEventsByTask(sampleTask.id);
      expect(events.some((e) => e.eventType === SafeChainEventType.PARTIAL_DELIVERY_CONFIRMED)).toBe(true);
      expect(events.some((e) => e.eventType === SafeChainEventType.DELIVERED)).toBe(true);
    });

    it('should reject duplicate delivery confirmation', async () => {
      await service.confirmDelivery(sampleTask.id, recipientUser, {
        receivedQuantity: 50,
        quantityUnit: 'kg',
      });

      await expect(
        service.confirmDelivery(sampleTask.id, recipientUser, {
          receivedQuantity: 50,
          quantityUnit: 'kg',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Failure Workflows & Administrative Reassignment', () => {
    it('should record pickup failure and terminate task as failed', async () => {
      await service.acceptTask(sampleTask.id, volunteerA);

      const failed = await service.reportPickupFailure(sampleTask.id, volunteerA, {
        reason: 'Donor kitchen was flooded and closed for maintenance',
      });

      expect(failed.status).toBe(DeliveryStatus.FAILED);
      expect(failed.failureReason).toContain('flooded');
    });

    it('should allow platform admin to reassign task to another volunteer', async () => {
      await service.acceptTask(sampleTask.id, volunteerA);
      await service.reportPickupFailure(sampleTask.id, volunteerA, {
        reason: 'Flat tire',
      });

      const reassigned = await service.reassignTask(
        sampleTask.id,
        { volunteerId: volunteerB, reason: 'Reassigned after vehicle breakdown' },
        adminUser,
      );

      expect(reassigned.status).toBe(DeliveryStatus.ASSIGNED);
      expect(reassigned.volunteerId).toBe(volunteerB);
    });

    it('should allow platform admin to resolve quantity discrepancies', async () => {
      await service.acceptTask(sampleTask.id, volunteerA);
      await service.confirmPickup(sampleTask.id, volunteerA, {
        qrToken: sampleQrToken,
        collectedQuantity: 40,
        quantityUnit: 'kg',
      });

      const discrepancies = await service.getDiscrepancies(sampleTask.id);
      expect(discrepancies).toHaveLength(1);

      const resolved = await service.resolveDiscrepancy(
        discrepancies[0].id,
        {
          status: DiscrepancyStatus.RESOLVED,
          resolutionNotes: 'Shortage confirmed with donor billing records.',
        },
        adminUser,
      );

      expect(resolved.status).toBe(DiscrepancyStatus.RESOLVED);
      expect(resolved.resolvedBy).toBe(adminUser);
    });
  });
});
