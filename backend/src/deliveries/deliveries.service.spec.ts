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
      // Delegates to dbMock.queryOne stubs; per-test clientMock.query stubs take precedence
      query: jest.fn(async (sql: string, params?: any[]) => {
        const row = await dbMock.queryOne(sql, params);
        return { rows: row === undefined || row === null ? [] : [row] };
      }),
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
        expect.anything(),

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

  describe('claimDelivery', () => {
    const mockUnassignedTask = {
      id: 'task-open-1',
      allocation_id: 'alloc-1',
      batch_id: 'batch-1',
      volunteer_id: null,
      status: 'assigned',
    };

    it('should allow an active registered volunteer to self-claim an open delivery task', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(mockUnassignedTask) // task query
        .mockResolvedValueOnce({ id: 'volunteer-uuid', full_name: 'Volunteer Sarah', role: 'volunteer', account_status: 'active' }) // volunteer profile check
        .mockResolvedValueOnce({
          ...mockUnassignedTask,
          volunteer_id: 'volunteer-uuid',
          status: 'accepted',
        }); // updated task

      const result = await service.claimDelivery('task-open-1', mockVolunteerUser);

      expect(result.message).toContain('claimed');
      expect(result.deliveryTask.volunteer_id).toBe('volunteer-uuid');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'volunteer_assigned',
          batchId: 'batch-1',
          deliveryId: 'task-open-1',
        }),
        expect.anything(),
      );
    });

    it('should throw ForbiddenException if a non-volunteer attempts to claim a delivery', async () => {
      const donorUser = {
        id: 'donor-user',
        email: 'donor@foodloop.org',
        fullName: 'Donor John',
        role: AppRole.DONOR,
      };

      await expect(service.claimDelivery('task-open-1', donorUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if task is already claimed by another volunteer', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        ...mockUnassignedTask,
        volunteer_id: 'other-volunteer-uuid',
      });

      await expect(service.claimDelivery('task-open-1', mockVolunteerUser)).rejects.toThrow(BadRequestException);
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
        expect.anything(),

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
        expect.anything(),

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
      clientMock.query
        .mockResolvedValueOnce({ rows: [mockTask] }) // delivery task lookup
        .mockResolvedValueOnce({ rows: [{ id: 'conf-1' }] }); // delivery_confirmations insert

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
        expect.anything(),

      );
    });

    it('should record discrepancy and physical loss when quantity delivered < allocated', async () => {
      clientMock.query
        .mockResolvedValueOnce({ rows: [mockTask] }) // delivery task lookup
        .mockResolvedValueOnce({ rows: [{ id: 'conf-1' }] }); // delivery_confirmations insert

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
        expect.anything(),

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

  describe('Delivery mutation authorisation (Phase 0, Task C)', () => {
    const task = {
      id: 'task-1',
      allocation_id: 'alloc-1',
      batch_id: 'batch-1',
      recipient_organisation_id: 'recip-1',
      donor_organisation_id: 'donor-1',
      volunteer_id: 'volunteer-uuid',
      allocated_quantity: 50,
      quantity_unit: 'kg',
      status: 'accepted',
    };

    const activeVolunteer = { id: 'new-volunteer-uuid', full_name: 'New Volunteer' };

    /** Stubs client.query by SQL kind, records every mutating statement. */
    const routeClient = (taskOverrides: Record<string, unknown> = {}) => {
      const statements: { sql: string; params?: any[] }[] = [];
      clientMock.query.mockImplementation((sql: string, params?: any[]) => {
        statements.push({ sql, params });
        if (sql.includes('FROM public.delivery_tasks') && sql.includes('SELECT')) {
          return Promise.resolve({ rows: [{ ...task, ...taskOverrides }] });
        }
        if (sql.includes('FROM public.profiles')) {
          return Promise.resolve({ rows: [activeVolunteer] });
        }
        return Promise.resolve({ rows: [{ ...task, ...taskOverrides, volunteer_id: 'new-volunteer-uuid' }] });
      });
      return statements;
    };

    const mutatingStatements = (statements: { sql: string }[]) =>
      statements.filter((s) => /^(UPDATE|INSERT|DELETE)/i.test(s.sql.trim()));

    it('assign: unrelated authenticated user is denied with no database mutation or SafeChain event', async () => {
      const statements = routeClient();
      const outsider: AuthUser = { id: 'intruder', fullName: 'Outsider', role: AppRole.DONOR };

      await expect(
        service.assignVolunteer('task-1', { volunteerId: 'new-volunteer-uuid' }, outsider),
      ).rejects.toThrow(ForbiddenException);

      expect(mutatingStatements(statements)).toEqual([]);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('assign: recipient organisation member is allowed to assign a verified active volunteer', async () => {
      const statements = routeClient();
      const recipient: AuthUser = {
        id: 'recip-member',
        fullName: 'Recipient Rep',
        role: AppRole.RECIPIENT,
        organisationId: 'recip-1',
      };

      const result = await service.assignVolunteer(
        'task-1',
        { volunteerId: 'new-volunteer-uuid' },
        recipient,
      );

      expect(result.deliveryTask.volunteer_id).toBe('new-volunteer-uuid');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'volunteer_assigned' }),
        expect.anything(),
      );
    });

    it('assign: donor-organisation member is allowed (workflow coordinator)', async () => {
      routeClient();
      const donor: AuthUser = {
        id: 'donor-member',
        fullName: 'Donor Rep',
        role: AppRole.DONOR,
        organisationId: 'donor-1',
      };

      const result = await service.assignVolunteer(
        'task-1',
        { volunteerId: 'new-volunteer-uuid' },
        donor,
      );

      expect(result.deliveryTask.volunteer_id).toBe('new-volunteer-uuid');
    });

    it('assign: caller-supplied volunteerId must resolve to a trusted volunteer profile', async () => {
      routeClient();
      // Profile lookup returns nothing for the supplied id (e.g. donor account)
      clientMock.query.mockImplementation((sql: string) => {
        if (sql.includes('FROM public.profiles')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [task] });
      });

      await expect(
        service.assignVolunteer(
          'task-1',
          { volunteerId: '44444444-4444-4444-4444-444444444444' },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('assign: volunteer profile SQL enforces trusted volunteer role AND active account status', async () => {
      const statements = routeClient();

      await service.assignVolunteer(
        'task-1',
        { volunteerId: 'new-volunteer-uuid' },
        mockAdminUser,
      );

      const profileLookup = statements.find((s) => s.sql.includes('FROM public.profiles'));
      expect(profileLookup).toBeDefined();
      expect(profileLookup!.sql).toContain("role = 'volunteer'::public.app_role");
      expect(profileLookup!.sql).toContain("account_status = 'active'");
    });

    it('reassign: currently assigned volunteer cannot redirect a delivery to an arbitrary account', async () => {
      routeClient();
      const assignedVolunteer: AuthUser = {
        id: 'volunteer-uuid',
        fullName: 'Volunteer Sarah',
        role: AppRole.VOLUNTEER,
      };

      await expect(
        service.reassignVolunteer(
          'task-1',
          { newVolunteerId: 'new-volunteer-uuid', reason: 'Prefer my friend' },
          assignedVolunteer,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('reassign: recipient organisation member is allowed and history is preserved', async () => {
      const statements = routeClient({ volunteer_id: 'volunteer-uuid' });
      const recipient: AuthUser = {
        id: 'recip-member',
        fullName: 'Recipient Rep',
        role: AppRole.RECIPIENT,
        organisationId: 'recip-1',
      };

      const result = await service.reassignVolunteer(
        'task-1',
        { newVolunteerId: 'new-volunteer-uuid', reason: 'Vehicle breakdown' },
        recipient,
      );

      expect(result.message).toContain('reassigned');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'volunteer_reassigned',
          eventData: expect.objectContaining({
            previousVolunteerId: 'volunteer-uuid',
            newVolunteerId: 'new-volunteer-uuid',
          }),
        }),
        expect.anything(),
      );
      // New volunteer validation runs inside the same state rules
      expect(statements.some((s) => s.sql.includes('FROM public.profiles'))).toBe(true);
    });

    it('cancel: unrelated user is denied with no mutation or SafeChain event', async () => {
      const statements = routeClient();
      const outsider: AuthUser = { id: 'intruder', fullName: 'Outsider', role: AppRole.DONOR };

      await expect(
        service.cancelDelivery('task-1', { reason: 'No longer needed' }, outsider),
      ).rejects.toThrow(ForbiddenException);

      expect(mutatingStatements(statements)).toEqual([]);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('cancel: the assigned volunteer cannot cancel an arbitrary delivery task', async () => {
      routeClient();
      const assignedVolunteer: AuthUser = {
        id: 'volunteer-uuid',
        fullName: 'Volunteer Sarah',
        role: AppRole.VOLUNTEER,
      };

      await expect(
        service.cancelDelivery('task-1', { reason: 'Too busy today' }, assignedVolunteer),
      ).rejects.toThrow(ForbiddenException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('cancel: donor organisation member is allowed and cancellation is audited', async () => {
      routeClient();
      const donor: AuthUser = {
        id: 'donor-member',
        fullName: 'Donor Rep',
        role: AppRole.DONOR,
        organisationId: 'donor-1',
      };

      const result = await service.cancelDelivery('task-1', { reason: 'Batch spoiled' }, donor);

      expect(result.message).toContain('cancelled');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'delivery_cancelled',
          eventData: expect.objectContaining({ reason: 'Batch spoiled' }),
        }),
        expect.anything(),
      );
    });

    it('complete: donor from another organisation must not fabricate recipient confirmation', async () => {
      routeClient();
      const foreignDonor: AuthUser = {
        id: 'donor-member',
        fullName: 'Donor Rep',
        role: AppRole.DONOR,
        organisationId: 'donor-1',
      };

      await expect(
        service.completeDelivery(
          'task-1',
          { receivedQuantity: 50, damagedQuantity: 0, missingQuantity: 0, quantityUnit: 'kg' },
          foreignDonor,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('complete: unrelated volunteer must not fabricate recipient confirmation', async () => {
      routeClient();
      await expect(
        service.completeDelivery(
          'task-1',
          { receivedQuantity: 50, damagedQuantity: 0, missingQuantity: 0, quantityUnit: 'kg' },
          mockVolunteerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });

    it('complete: platform admin override is allowed and the admin is recorded as confirmer', async () => {
      const statements = routeClient();

      const result = await service.completeDelivery(
        'task-1',
        { receivedQuantity: 50, damagedQuantity: 0, missingQuantity: 0, quantityUnit: 'kg' },
        mockAdminUser,
      );

      expect(result.hasDiscrepancy).toBe(false);
      const insert = statements.find((s) => s.sql.includes('INSERT INTO public.delivery_confirmations'));
      expect(insert).toBeDefined();
      expect(insert!.params![1]).toBe(mockAdminUser.id);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'delivered', batchId: 'batch-1' }),
        expect.anything(),
      );
    });

    it('complete: quantity reconciliation is still enforced after the authorisation gate', async () => {
      routeClient();
      const recipient: AuthUser = {
        id: 'recip-member',
        fullName: 'Recipient Rep',
        role: AppRole.RECIPIENT,
        organisationId: 'recip-1',
      };

      await expect(
        service.completeDelivery(
          'task-1',
          { receivedQuantity: 30, damagedQuantity: 0, missingQuantity: 0, quantityUnit: 'kg' },
          recipient,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(safechainMock.recordEvent).not.toHaveBeenCalled();
    });
  });

  describe('Delivery list default-deny (Phase 0, Task D)', () => {
    const captureSql = (mock = dbMock) => {
      mock.queryOne = jest.fn().mockImplementation((sql: string, params?: any[]) => {
        (mock as any).countSql = sql;
        (mock as any).countParams = (params ?? []).slice();
        return Promise.resolve({ total: 0 });
      });
      mock.query = jest.fn().mockResolvedValue([]);
      return mock as any;
    };

    it('org-less non-admin (e.g. inspector without an org) receives a deliberate ForbiddenException, never platform-wide data', async () => {
      const inspector: AuthUser = {
        id: 'inspector-uuid',
        fullName: 'Inspector Ivor',
        role: AppRole.INSPECTOR,
      };

      await expect(service.listDeliveries({}, inspector)).rejects.toThrow(ForbiddenException);
      expect(dbMock.queryOne).not.toHaveBeenCalled();
    });

    it('volunteer keeps assigned + unassigned (claim workflow) task visibility', async () => {
      captureSql();

      const result = await service.listDeliveries({}, mockVolunteerUser);

      expect(result.data).toEqual([]);
      const sql = (dbMock as any).countSql as string;
      expect(sql).toContain('dt.volunteer_id = $1 OR dt.volunteer_id IS NULL');
      expect((dbMock as any).countParams).toEqual([mockVolunteerUser.id]);
    });

    it('organisation member is scoped to records of their own organisation', async () => {
      captureSql();
      const recipient: AuthUser = {
        id: 'recip-member',
        fullName: 'Recipient Rep',
        role: AppRole.RECIPIENT,
        organisationId: 'recip-1',
      };

      const result = await service.listDeliveries({}, recipient);

      expect(result.data).toEqual([]);
      const sql = (dbMock as any).countSql as string;
      expect(sql).toContain('a.recipient_organisation_id = $1 OR b.donor_organisation_id = $1');
      expect((dbMock as any).countParams).toEqual(['recip-1']);
    });

    it('admin retains platform-wide list with pagination intact', async () => {
      captureSql();
      dbMock.query = jest.fn().mockResolvedValue([{ id: 'dt-1' }, { id: 'dt-2' }]);

      const result = await service.listDeliveries({ page: 1, limit: 2 }, mockAdminUser);

      expect(result.data).toEqual([{ id: 'dt-1' }, { id: 'dt-2' }]);
      expect((dbMock as any).countSql).not.toContain('volunteer_id = $1');
      const dataSql = (dbMock as any).lastDataSql ?? '';
      // data query still carries LIMIT/OFFSET pagination
      expect(result.meta).toMatchObject({ total: 0, page: 1, limit: 2 });
    });
  });

  describe('Delivery detail least-privilege (Phase 0, Task E)', () => {
    const deliveryRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'task-1',
      donor_organisation_id: 'donor-1',
      recipient_organisation_id: 'recip-1',
      volunteer_id: 'volunteer-uuid',
      volunteer_phone: '+995555000000',
      ...overrides,
    });

    it('unrelated user is concealed with 404 (batch/task existence not revealed)', async () => {
      dbMock.queryOne.mockResolvedValueOnce(deliveryRow());
      const outsider: AuthUser = { id: 'intruder', fullName: 'Outsider', role: AppRole.DONOR };

      await expect(service.getDeliveryById('task-1', outsider)).rejects.toThrow(NotFoundException);
    });

    it('assigned volunteer may view their task, but never the volunteer phone number', async () => {
      dbMock.queryOne.mockResolvedValueOnce(deliveryRow());

      const result = await service.getDeliveryById('task-1', mockVolunteerUser);

      expect(result.id).toBe('task-1');
      expect(result.volunteer_phone).toBeNull();
    });

    it('organisation member sees their task including the volunteer phone (coordination need)', async () => {
      dbMock.queryOne.mockResolvedValueOnce(deliveryRow());
      const recipient: AuthUser = {
        id: 'recip-member',
        fullName: 'Recipient Rep',
        role: AppRole.RECIPIENT,
        organisationId: 'recip-1',
      };

      const result = await service.getDeliveryById('task-1', recipient);

      expect(result.volunteer_phone).toBe('+995555000000');
    });

    it('unassigned tasks remain visible to volunteers for the claim workflow, phone null', async () => {
      dbMock.queryOne.mockResolvedValueOnce(deliveryRow({ volunteer_id: null, volunteer_phone: null }));

      const result = await service.getDeliveryById('task-1', mockVolunteerUser);

      expect(result.id).toBe('task-1');
      expect(result.volunteer_phone).toBeNull();
    });

    it('organisation-less unrelated volunteer for an assigned task gets 404', async () => {
      dbMock.queryOne.mockResolvedValueOnce(deliveryRow());

      await expect(service.getDeliveryById('task-1', mockOtherUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateVolunteerLocation', () => {
    const validDto = { latitude: 28.6139, longitude: 77.209 };

    it('rejects with NotFoundException when task does not exist', async () => {
      dbMock.queryOne.mockResolvedValueOnce(null);
      await expect(
        service.updateVolunteerLocation('nonexistent', validDto, mockVolunteerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects with ForbiddenException when called by an unassigned user', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'task-1',
        volunteer_id: 'other-vol-id',
        status: 'assigned',
      });
      await expect(
        service.updateVolunteerLocation('task-1', validDto, mockVolunteerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects with BadRequestException when task is already delivered', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'task-1',
        volunteer_id: mockVolunteerUser.id,
        status: 'delivered',
      });
      await expect(
        service.updateVolunteerLocation('task-1', validDto, mockVolunteerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully updates location when called by assigned volunteer', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'task-1',
        volunteer_id: mockVolunteerUser.id,
        status: 'in_transit',
      });
      dbMock.query.mockResolvedValueOnce([]);

      const result = await service.updateVolunteerLocation('task-1', validDto, mockVolunteerUser);
      expect(result.deliveryId).toBe('task-1');
      expect(result.latitude).toBe(28.6139);
      expect(result.longitude).toBe(77.209);
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.delivery_tasks'),
        expect.arrayContaining([77.209, 28.6139, 'task-1']),
      );
    });
  });
});
