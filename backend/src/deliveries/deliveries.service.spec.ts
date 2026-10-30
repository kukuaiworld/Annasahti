import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let dbMock: any;
  let clientMock: any;
  let safechainMock: any;

  const mockAdminUser: AuthUser = {
    id: 'admin-uuid',
    fullName: 'Admin Coordinator',
    role: AppRole.ADMIN,
  };

  const mockVolunteerUser: AuthUser = {
    id: 'volunteer-uuid',
    fullName: 'Volunteer Sarah',
    role: AppRole.VOLUNTEER,
  };

  const mockOtherUser: AuthUser = {
    id: 'other-uuid',
    fullName: 'Volunteer John',
    role: AppRole.VOLUNTEER,
  };

  beforeEach(async () => {
    clientMock = {
      query: jest.fn(),
    };

    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(async (cb) => cb(clientMock)),
    };

    safechainMock = {
      recordEvent: jest.fn().mockResolvedValue({ id: 'sc-event-id' }),
      getBatchEvents: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        { provide: DatabaseService, useValue: dbMock },
        { provide: SafeChainService, useValue: safechainMock },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  describe('assignVolunteer', () => {
    const mockTask = {
      id: 'task-1',
      allocation_id: 'alloc-1',
      batch_id: 'batch-1',
      recipient_organisation_id: 'recip-1',
      donor_organisation_id: 'donor-1',
      status: 'pending',
    };

    const mockVolunteer = {
      id: 'volunteer-uuid',
      full_name: 'Volunteer Sarah',
      role: 'volunteer',
    };

    it('should assign a volunteer to pending delivery task and record SafeChain event', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(mockTask) // task lookup
        .mockResolvedValueOnce(mockVolunteer) // volunteer profile lookup
        .mockResolvedValueOnce({
          ...mockTask,
          volunteer_id: 'volunteer-uuid',
          status: 'accepted',
        }); // update task

      const result = await service.assignVolunteer(
        'task-1',
        { volunteerId: 'volunteer-uuid', deliveryNotes: 'Handle fragile containers' },
        mockAdminUser,
      );

      expect(result.deliveryTask.status).toBe('accepted');
      expect(result.deliveryTask.volunteer_id).toBe('volunteer-uuid');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'volunteer_assigned',
          batchId: 'batch-1',
          deliveryId: 'task-1',
        }),
      );
    });

    it('should throw BadRequestException if task is already delivered', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        ...mockTask,
        status: 'delivered',
      });

      await expect(
        service.assignVolunteer('task-1', { volunteerId: 'volunteer-uuid' }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassignVolunteer', () => {
    const mockTaskAssigned = {
      id: 'task-1',
      allocation_id: 'alloc-1',
      batch_id: 'batch-1',
      volunteer_id: 'volunteer-uuid',
      status: 'accepted',
    };

    it('should record reason and preserve reassignment history in SafeChain', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(mockTaskAssigned) // task query
        .mockResolvedValueOnce({ id: 'volunteer-uuid', full_name: 'Volunteer Sarah' }) // prev vol
        .mockResolvedValueOnce({ id: 'other-uuid', full_name: 'Volunteer John' }) // new vol
        .mockResolvedValueOnce({
          ...mockTaskAssigned,
          volunteer_id: 'other-uuid',
        }); // updated task

      const result = await service.reassignVolunteer(
        'task-1',
        {
          newVolunteerId: 'other-uuid',
          reason: 'Vehicle breakdown on route to pickup',
        },
        mockAdminUser,
      );

      expect(result.message).toContain('reassigned');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'volunteer_reassigned',
          batchId: 'batch-1',
          eventData: expect.objectContaining({
            previousVolunteerId: 'volunteer-uuid',
            newVolunteerId: 'other-uuid',
            reason: 'Vehicle breakdown on route to pickup',
          }),
        }),
      );
    });
  });

  describe('recordPickup', () => {
    it('should transition status to in_transit when assigned volunteer confirms pickup', async () => {
      const mockTask = {
        id: 'task-1',
        allocation_id: 'alloc-1',
        batch_id: 'batch-1',
        volunteer_id: 'volunteer-uuid',
        status: 'accepted',
      };

      dbMock.queryOne
        .mockResolvedValueOnce(mockTask) // task query
        .mockResolvedValueOnce({
          ...mockTask,
          status: 'in_transit',
        }); // update status

      const result = await service.recordPickup(
        'task-1',
        { pickupNotes: 'Checked food temperature: 4 degrees Celsius' },
        mockVolunteerUser,
      );

      expect(result.deliveryTask.status).toBe('in_transit');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'pickup_confirmed',
          batchId: 'batch-1',
        }),
      );
    });

    it('should forbid unassigned volunteer from confirming pickup', async () => {
      const mockTask = {
        id: 'task-1',
        allocation_id: 'alloc-1',
        batch_id: 'batch-1',
        volunteer_id: 'volunteer-uuid',
        status: 'accepted',
      };

      dbMock.queryOne.mockResolvedValueOnce(mockTask);

      await expect(
        service.recordPickup('task-1', {}, mockOtherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeDelivery', () => {
    const mockTask = {
      id: 'task-1',
      allocation_id: 'alloc-1',
      batch_id: 'batch-1',
      allocated_quantity: 50,
      quantity_unit: 'kg',
      volunteer_id: 'volunteer-uuid',
      recipient_organisation_id: 'recip-org-uuid',
      donor_organisation_id: 'donor-org-uuid',
      status: 'in_transit',
    };

    const mockRecipientUser: AuthUser = {
      id: 'recip-user',
      fullName: 'Recipient Rep',
      role: AppRole.RECIPIENT,
      organisationId: 'recip-org-uuid',
    };

    it('should complete delivery and record delivered SafeChain event when full quantity is received', async () => {
      dbMock.queryOne.mockResolvedValueOnce(mockTask);

      clientMock.query
        .mockResolvedValueOnce({ rows: [{ id: 'conf-1' }] }) // delivery_confirmations
        .mockResolvedValueOnce({ rows: [{ ...mockTask, status: 'delivered' }] }) // delivery_tasks update
        .mockResolvedValueOnce({ rows: [] }) // food_allocations update
        .mockResolvedValueOnce({ rows: [] }); // food_batches update

      const result = await service.completeDelivery(
        'task-1',
        {
          receivedQuantity: 50,
          damagedQuantity: 0,
          missingQuantity: 0,
          quantityUnit: 'kg',
          recipientNotes: 'All boxes in perfect chilled condition',
        },
        mockRecipientUser,
      );

      expect(result.message).toContain('successfully');
      expect(result.hasDiscrepancy).toBe(false);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'delivered',
          batchId: 'batch-1',
        }),
      );
    });

    it('should record discrepancy and physical loss when quantity delivered < allocated', async () => {
      dbMock.queryOne.mockResolvedValueOnce(mockTask);

      clientMock.query
        .mockResolvedValueOnce({ rows: [{ id: 'conf-1' }] })
        .mockResolvedValueOnce({ rows: [{ ...mockTask, status: 'delivered' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.completeDelivery(
        'task-1',
        {
          receivedQuantity: 40,
          damagedQuantity: 5,
          missingQuantity: 5,
          quantityUnit: 'kg',
          discrepancyReason: '1 container leaked, 1 box dropped during transit',
        },
        mockRecipientUser,
      );

      expect(result.message).toContain('successfully');
      expect(result.hasDiscrepancy).toBe(true);

      // SafeChain discrepancy event must have been recorded
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'delivery_discrepancy_reported',
          batchId: 'batch-1',
          eventData: expect.objectContaining({
            damagedQuantity: 5,
            missingQuantity: 5,
          }),
        }),
      );
    });

    it('should reject delivery completion if received + damaged + missing != allocated quantity', async () => {
      dbMock.queryOne.mockResolvedValueOnce(mockTask);

      await expect(
        service.completeDelivery(
          'task-1',
          {
            receivedQuantity: 30, // 30 + 0 + 0 = 30 != 50 allocated!
            damagedQuantity: 0,
            missingQuantity: 0,
            quantityUnit: 'kg',
          },
          mockRecipientUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
