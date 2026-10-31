import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole, FoodBatchStatus, FoodCategory } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('AllocationsService', () => {
  let service: AllocationsService;
  let dbMock: any;
  let clientMock: any;
  let safechainMock: any;

  const mockDonorUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Donor Chef',
    role: AppRole.DONOR,
    organisationId: 'donor-org-uuid',
  };

  const mockAdminUser: AuthUser = {
    id: '33333333-3333-3333-3333-333333333333',
    fullName: 'Admin User',
    role: AppRole.ADMIN,
  };

  const mockRecipientUser: AuthUser = {
    id: '55555555-5555-5555-5555-555555555555',
    fullName: 'Shelter Manager',
    role: AppRole.RECIPIENT,
    organisationId: 'recip-org-uuid',
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
        AllocationsService,
        { provide: DatabaseService, useValue: dbMock },
        { provide: SafeChainService, useValue: safechainMock },
      ],
    }).compile();

    service = module.get<AllocationsService>(AllocationsService);
  });

  describe('createAllocation', () => {
    const validDto = {
      batchId: 'batch-uuid-1',
      recipientOrganisationId: 'recip-org-uuid',
      allocatedQuantity: 25,
      quantityUnit: 'kg',
      notes: 'For evening meal distribution',
    };

    const mockBatchRow = {
      id: 'batch-uuid-1',
      batch_code: 'FL-2026-0001',
      donor_organisation_id: 'donor-org-uuid',
      donor_name: 'Metro Kitchen',
      food_name: 'Rice & Curry',
      category: FoodCategory.HUMAN_CONSUMPTION,
      quantity: 50,
      quantity_unit: 'kg',
      available_quantity: 50,
      allocated_quantity: 0,
      damaged_quantity: 0,
      missing_quantity: 0,
      status: FoodBatchStatus.APPROVED,
    };

    const mockRecipientRow = {
      id: 'recip-org-uuid',
      name: 'Hope Shelter',
      verification_status: 'verified',
      organisation_type: 'shelter',
    };

    it('should create an allocation atomically with row-locking and initialize delivery task', async () => {
      // 1. batch query FOR UPDATE
      clientMock.query
        .mockResolvedValueOnce({ rows: [mockBatchRow] }) // batch lock
        .mockResolvedValueOnce({ rows: [mockRecipientRow] }) // recipient check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'alloc-1',
              batch_id: 'batch-uuid-1',
              recipient_organisation_id: 'recip-org-uuid',
              allocated_quantity: 25,
              quantity_unit: 'kg',
              status: 'pending',
            },
          ],
        }) // allocation insert
        .mockResolvedValueOnce({ rows: [{ id: 'task-1' }] }); // delivery task insert

      const result = await service.createAllocation(validDto, mockDonorUser);

      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'),
        [validDto.batchId],
      );
      expect(result.allocation.id).toBe('alloc-1');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'allocation_created',
          batchId: 'batch-uuid-1',
        }),
        expect.anything(),
      );
    });

    it('should reject allocation creation if requested quantity exceeds available balance', async () => {
      clientMock.query.mockResolvedValueOnce({
        rows: [
          {
            ...mockBatchRow,
            available_quantity: 10,
          },
        ],
      });

      await expect(
        service.createAllocation({ ...validDto, allocatedQuantity: 25 }, mockDonorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject allocation creation if quantity unit mismatches batch unit', async () => {
      clientMock.query.mockResolvedValueOnce({
        rows: [mockBatchRow],
      });

      await expect(
        service.createAllocation({ ...validDto, quantityUnit: 'litres' }, mockDonorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject allocation creation if batch is not in approved or partially allocated status', async () => {
      clientMock.query.mockResolvedValueOnce({
        rows: [
          {
            ...mockBatchRow,
            status: FoodBatchStatus.PENDING_INSPECTION,
          },
        ],
      });

      await expect(service.createAllocation(validDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject allocation creation if recipient is unverified', async () => {
      clientMock.query
        .mockResolvedValueOnce({ rows: [mockBatchRow] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockRecipientRow,
              verification_status: 'pending',
            },
          ],
        });

      await expect(service.createAllocation(validDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptAllocation', () => {
    it('should allow recipient organisation member to accept allocation', async () => {
      const mockAlloc = {
        id: 'alloc-1',
        batch_id: 'batch-1',
        recipient_organisation_id: 'recip-org-uuid',
        allocated_quantity: 20,
        quantity_unit: 'kg',
        status: 'pending',
      };

      dbMock.queryOne
        .mockResolvedValueOnce(mockAlloc) // query allocation
        .mockResolvedValueOnce({
          ...mockAlloc,
          status: 'accepted',
          accepted_at: new Date(),
        }); // update status

      const result = await service.acceptAllocation('alloc-1', mockRecipientUser);

      expect(result.allocation.status).toBe('accepted');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'allocation_accepted',
          batchId: 'batch-1',
        }),
        expect.anything(),

      );
    });

    it('should forbid other organisation from accepting allocation', async () => {
      const mockAlloc = {
        id: 'alloc-1',
        batch_id: 'batch-1',
        recipient_organisation_id: 'recip-org-uuid',
        status: 'pending',
      };

      dbMock.queryOne.mockResolvedValueOnce(mockAlloc);

      const intruderUser: AuthUser = {
        id: '9999',
        fullName: 'Intruder',
        role: AppRole.RECIPIENT,
        organisationId: 'different-org-uuid',
      };

      await expect(service.acceptAllocation('alloc-1', intruderUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('rejectAllocation', () => {
    it('should release batch quantity and cancel delivery task when allocation is rejected', async () => {
      const mockAlloc = {
        id: 'alloc-1',
        batch_id: 'batch-1',
        recipient_organisation_id: 'recip-org-uuid',
        allocated_quantity: 20,
        status: 'pending',
      };

      dbMock.queryOne
        .mockResolvedValueOnce(mockAlloc) // query allocation
        .mockResolvedValueOnce({ ...mockAlloc, status: 'cancelled' }) // update allocation
        .mockResolvedValueOnce({ id: 'task-1' }); // cancel delivery task

      const result = await service.rejectAllocation(
        'alloc-1',
        'Lack of refrigeration capacity',
        mockRecipientUser,
      );

      expect(result.message).toContain('rejected');
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'allocation_rejected',
          batchId: 'batch-1',
        }),
        expect.anything(),

      );
    });
  });

  describe('Allocation list default-deny (Phase 0, Task D)', () => {
    const captureSql = () => {
      dbMock.queryOne = jest.fn().mockImplementation((sql: string, params?: any[]) => {
        (dbMock as any).countSql = sql;
        (dbMock as any).countParams = (params ?? []).slice();
        return Promise.resolve({ total: 0 });
      });
      dbMock.query = jest.fn().mockResolvedValue([]);
    };

    it('org-less non-admin receives a deliberate ForbiddenException, never platform-wide data', async () => {
      const inspector: AuthUser = {
        id: 'inspector-uuid',
        fullName: 'Inspector Ivor',
        role: AppRole.INSPECTOR,
      };

      await expect(service.listAllocations({}, inspector)).rejects.toThrow(ForbiddenException);
      expect(dbMock.queryOne).not.toHaveBeenCalled();
    });

    it('volunteer receives only allocations they deliver (no org fallout)', async () => {
      const volunteer: AuthUser = {
        id: 'volunteer-uuid',
        fullName: 'Volunteer Sarah',
        role: AppRole.VOLUNTEER,
      };
      captureSql();

      const result = await service.listAllocations({}, volunteer);

      expect(result.data).toEqual([]);
      const sql = (dbMock as any).countSql as string;
      expect(sql).toContain('dt.allocation_id = a.id AND dt.volunteer_id = $1');
      expect(sql).not.toContain('recipient_organisation_id = $1 OR');
      expect((dbMock as any).countParams).toEqual([volunteer.id]);
    });

    it('organisation member is scoped to records touching their own organisation', async () => {
      captureSql();

      const result = await service.listAllocations({}, mockRecipientUser);

      expect(result.data).toEqual([]);
      const sql = (dbMock as any).countSql as string;
      expect(sql).toContain('a.recipient_organisation_id = $1 OR b.donor_organisation_id = $1');
      expect((dbMock as any).countParams).toEqual([mockRecipientUser.organisationId]);
    });

    it('admin keeps platform-wide access and pagination still works', async () => {
      dbMock.queryOne = jest.fn().mockImplementation((sql: string, params?: any[]) => {
        (dbMock as any).countParams = (params ?? []).slice();
        return Promise.resolve({ total: 1 });
      });
      dbMock.query = jest.fn().mockResolvedValue([{ id: 'alloc-1' }]);

      const result = await service.listAllocations({ page: 2, limit: 1 }, mockAdminUser);

      expect(result.data).toEqual([{ id: 'alloc-1' }]);
      // Admin's own scope binds nothing; pagination params follow
      expect((dbMock as any).countParams).toEqual([]);
      expect(result.meta).toMatchObject({ total: 1, page: 2, limit: 1, totalPages: 1 });
    });
  });

  describe('Allocation detail least-privilege (Phase 0, Task E)', () => {
    const allocationRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'alloc-1',
      batch_id: 'batch-1',
      recipient_organisation_id: 'recip-org-uuid',
      donor_organisation_id: 'donor-org-uuid',
      allocated_quantity: 20,
      quantity_unit: 'kg',
      status: 'accepted',
      ...overrides,
    });

    it('volunteer with a real delivery task relationship may view the allocation', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(allocationRow()) // allocation lookup
        .mockResolvedValueOnce({ allowed: true }); // delivery-task relationship check
      dbMock.query = jest.fn().mockResolvedValue([]);

      const volunteer: AuthUser = {
        id: 'volunteer-uuid',
        fullName: 'Volunteer Sarah',
        role: AppRole.VOLUNTEER,
      };

      const result = await service.getAllocationById('alloc-1', volunteer);

      expect(result.id).toBe('alloc-1');
      // Volunteer never sees volunteers' personal phone numbers
      expect(result.deliveryTasks).toEqual([]);
    });

    it('volunteer WITHOUT a delivery relationship is concealed with 404 (no volunteer enumeration)', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(allocationRow())
        .mockResolvedValueOnce({ allowed: false });

      const strangerVolunteer: AuthUser = {
        id: 'other-volunteer-uuid',
        fullName: 'Volunteer John',
        role: AppRole.VOLUNTEER,
      };

      await expect(service.getAllocationById('alloc-1', strangerVolunteer)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('non-member non-volunteer (unrelated inspector) is concealed with 404', async () => {
      dbMock.queryOne.mockResolvedValueOnce(allocationRow());

      const inspector: AuthUser = {
        id: 'inspector-uuid',
        fullName: 'Inspector Ivor',
        role: AppRole.INSPECTOR,
      };

      await expect(service.getAllocationById('alloc-1', inspector)).rejects.toThrow(NotFoundException);
    });

    it('donor organisation member keeps full access including volunteer contact', async () => {
      dbMock.queryOne.mockResolvedValueOnce(allocationRow());
      dbMock.query.mockResolvedValue([{ id: 'dt-1', volunteer_phone: '+995555000111' }]);

      const result = await service.getAllocationById('alloc-1', mockDonorUser);

      expect(result.deliveryTasks[0].volunteer_phone).toBe('+995555000111');
    });

    it('recipient organisation member keeps full access including volunteer contact', async () => {
      dbMock.queryOne.mockResolvedValueOnce(allocationRow());
      dbMock.query.mockResolvedValue([{ id: 'dt-1', volunteer_phone: '+995555000111' }]);

      const result = await service.getAllocationById('alloc-1', mockRecipientUser);

      expect(result.deliveryTasks[0].volunteer_phone).toBe('+995555000111');
    });

    it('admin retains full access including volunteer contact', async () => {
      dbMock.queryOne.mockResolvedValueOnce(allocationRow());
      dbMock.query.mockResolvedValue([{ id: 'dt-1', volunteer_phone: '+995555000111' }]);

      const result = await service.getAllocationById('alloc-1', mockAdminUser);

      expect(result.deliveryTasks[0].volunteer_phone).toBe('+995555000111');
    });

    it('unrelated organisation member of another donor is concealed with 404', async () => {
      const otherDonorBatch = allocationRow({ donor_organisation_id: 'another-donor-org' });
      dbMock.queryOne.mockResolvedValueOnce(otherDonorBatch);

      await expect(service.getAllocationById('alloc-1', mockDonorUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
