import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FoodBatchesService } from './food-batches.service';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole, FoodBatchStatus, FoodCategory, AnimalSpecies } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('FoodBatchesService', () => {
  let service: FoodBatchesService;
  let dbMock: any;
  let safechainMock: any;

  const mockDonorUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Chef Marco',
    role: AppRole.DONOR,
    organisationId: '22222222-2222-2222-2222-222222222222',
  };

  const mockAdminUser: AuthUser = {
    id: '33333333-3333-3333-3333-333333333333',
    fullName: 'Admin User',
    role: AppRole.ADMIN,
  };

  const mockOtherUser: AuthUser = {
    id: '44444444-4444-4444-4444-444444444444',
    fullName: 'Intruder',
    role: AppRole.DONOR,
    organisationId: '99999999-9999-9999-9999-999999999999',
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(async (callback) => callback(dbMock)),
    };

    // Base implementation delegates query → queryOne (mirrors the row-shaped
    // client queries inside transactions); per-test stubs take precedence.
    dbMock.query.mockImplementation(async (sql: string, params?: any[]) => {
      const row = await dbMock.queryOne(sql, params);
      return { rows: row === undefined || row === null ? [] : [row] };
    });

    safechainMock = {
      recordEvent: jest.fn().mockResolvedValue({ id: 'event-uuid' }),
      getBatchEvents: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodBatchesService,
        { provide: DatabaseService, useValue: dbMock },
        { provide: SafeChainService, useValue: safechainMock },
      ],
    }).compile();

    service = module.get<FoodBatchesService>(FoodBatchesService);
  });

  describe('createBatch', () => {
    it('should create a food batch successfully and record SafeChain event', async () => {
      const createdBatch = {
        id: 'batch-uuid-1',
        batch_code: 'FL-TEST1234',
        donor_organisation_id: mockDonorUser.organisationId,
        food_name: 'Surplus Lentil Stew',
        quantity: 50,
        quantity_unit: 'kg',
        status: FoodBatchStatus.PENDING_INSPECTION,
      };

      dbMock.queryOne.mockResolvedValue(createdBatch);

      const result = await service.createBatch(
        {
          donorOrganisationId: mockDonorUser.organisationId!,
          foodName: 'Surplus Lentil Stew',
          quantity: 50,
          quantityUnit: 'kg',
        },
        mockDonorUser,
      );

      expect(result).toEqual(createdBatch);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          batchId: 'batch-uuid-1',
          eventType: 'batch_created',
        }),
        expect.anything(),

      );
    });

    it('should forbid creating batches for another organisation without admin role', async () => {
      await expect(
        service.createBatch(
          {
            donorOrganisationId: '22222222-2222-2222-2222-222222222222',
            foodName: 'Surplus Rice',
            quantity: 30,
            quantityUnit: 'kg',
          },
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject invalid time range where best before is before preparation time', async () => {
      await expect(
        service.createBatch(
          {
            donorOrganisationId: mockDonorUser.organisationId!,
            foodName: 'Cooked Curry',
            quantity: 10,
            quantityUnit: 'kg',
            preparedAt: '2026-10-31T12:00:00Z',
            bestBeforeAt: '2026-10-30T12:00:00Z',
          },
          mockDonorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('splitBatch (Parent-Child Splitting)', () => {
    const parentBatch = {
      id: 'parent-uuid',
      batch_code: 'FL-PARENT01',
      donor_organisation_id: mockDonorUser.organisationId,
      food_name: 'Mixed Surplus Buffet',
      quantity: 100,
      quantity_unit: 'kg',
      allocated_quantity: 0,
      damaged_quantity: 0,
      missing_quantity: 0,
      available_quantity: 100,
      status: FoodBatchStatus.APPROVED,
    };

    it('should split 100kg parent into child batches atomically with exact accounting', async () => {
      // Mock transaction query for SELECT FOR UPDATE
      dbMock.query = jest.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM public.food_batches WHERE id = $1 FOR UPDATE')) {
          return Promise.resolve({ rows: [parentBatch] });
        }
        if (sql.includes('INSERT INTO public.food_batches')) {
          return Promise.resolve({
            rows: [
              {
                id: 'child-uuid',
                batch_code: 'FL-CHILD99',
                parent_batch_id: parentBatch.id,
                quantity: 40,
                quantity_unit: 'kg',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const splitDto = {
        reason: 'Inspection separation by suitability route',
        children: [
          {
            quantity: 40,
            quantityUnit: 'kg',
            targetCategory: FoodCategory.HUMAN_CONSUMPTION,
          },
          {
            quantity: 20,
            quantityUnit: 'kg',
            targetCategory: FoodCategory.ANIMAL_APPROPRIATE,
            targetSpecies: [AnimalSpecies.CANINE],
          },
          {
            quantity: 40,
            quantityUnit: 'kg',
            targetCategory: FoodCategory.ORGANIC_WASTE,
          },
        ],
      };

      const result = await service.splitBatch(parentBatch.id, splitDto, mockDonorUser);

      expect(result.parentBatchId).toBe(parentBatch.id);
      expect(result.totalSplitQuantity).toBe(100);
      expect(result.remainingParentAvailableQuantity).toBe(0);
      expect(result.children.length).toBe(3);
    });

    it('should reject split when requested child quantity exceeds parent available balance', async () => {
      dbMock.query = jest.fn().mockResolvedValue({
        rows: [
          {
            ...parentBatch,
            available_quantity: 50, // Only 50kg left
          },
        ],
      });

      const splitDto = {
        reason: 'Over-allocation attempt',
        children: [
          {
            quantity: 60, // Exceeds 50kg!
            quantityUnit: 'kg',
            targetCategory: FoodCategory.HUMAN_CONSUMPTION,
          },
        ],
      };

      await expect(service.splitBatch(parentBatch.id, splitDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject split when child uses incompatible unit', async () => {
      dbMock.query = jest.fn().mockResolvedValue({
        rows: [parentBatch], // measured in 'kg'
      });

      const splitDto = {
        reason: 'Unit mismatch',
        children: [
          {
            quantity: 10,
            quantityUnit: 'litres', // Mismatches 'kg'
            targetCategory: FoodCategory.HUMAN_CONSUMPTION,
          },
        ],
      };

      await expect(service.splitBatch(parentBatch.id, splitDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject splitting to animal-appropriate route without target species', async () => {
      dbMock.query = jest.fn().mockResolvedValue({
        rows: [parentBatch],
      });

      const splitDto = {
        reason: 'Animal route without species',
        children: [
          {
            quantity: 20,
            quantityUnit: 'kg',
            targetCategory: FoodCategory.ANIMAL_APPROPRIATE,
            targetSpecies: [], // Empty species!
          },
        ],
      };

      await expect(service.splitBatch(parentBatch.id, splitDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject splitting a cancelled or rejected batch', async () => {
      dbMock.query = jest.fn().mockResolvedValue({
        rows: [
          {
            ...parentBatch,
            status: FoodBatchStatus.CANCELLED,
          },
        ],
      });

      const splitDto = {
        reason: 'Split cancelled batch',
        children: [
          {
            quantity: 10,
            quantityUnit: 'kg',
            targetCategory: FoodCategory.HUMAN_CONSUMPTION,
          },
        ],
      };

      await expect(service.splitBatch(parentBatch.id, splitDto, mockDonorUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelBatch', () => {
    it('should cancel an unallocated batch successfully', async () => {
      const activeBatch = {
        id: 'active-batch-uuid',
        donor_organisation_id: mockDonorUser.organisationId,
        status: FoodBatchStatus.PENDING_INSPECTION,
      };

      dbMock.queryOne
        .mockResolvedValueOnce(activeBatch)
        .mockResolvedValueOnce({ ...activeBatch, status: FoodBatchStatus.CANCELLED });

      const res = await service.cancelBatch(activeBatch.id, 'No longer needed', mockDonorUser);
      expect(res.status).toBe(FoodBatchStatus.CANCELLED);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'batch_cancelled',
        }),
        expect.anything(),

      );
    });

    it('should reject cancellation if batch is already in transit', async () => {
      dbMock.queryOne.mockResolvedValue({
        id: 'transit-batch-uuid',
        donor_organisation_id: mockDonorUser.organisationId,
        status: FoodBatchStatus.IN_TRANSIT,
      });

      await expect(
        service.cancelBatch('transit-batch-uuid', 'Too late', mockDonorUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Batch tenant isolation (Phase 0, Task B)', () => {
    const otherOrgBatch = {
      id: '55555555-5555-5555-5555-555555555555',
      batch_code: 'FL-OTHER01',
      donor_organisation_id: '99999999-9999-9999-9999-999999999999',
      status: FoodBatchStatus.APPROVED,
      parent_batch_id: null,
    };

    it('GET /:id conceals a cross-organisation batch as 404 (donor cannot read another org batch)', async () => {
      // 1st call: batch lookup (belongs to another donor org)
      // 2nd call: isBatchReadableByUser access check → denied
      dbMock.queryOne.mockResolvedValueOnce(otherOrgBatch).mockResolvedValueOnce({ allowed: false });

      await expect(service.getBatchById(otherOrgBatch.id, mockDonorUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('GET /:id allows a donor to read their own organisation batch', async () => {
      const ownBatch = { ...otherOrgBatch, donor_organisation_id: mockDonorUser.organisationId };
      dbMock.queryOne
        .mockResolvedValueOnce(ownBatch)
        .mockResolvedValueOnce({ allowed: true });
      dbMock.query = jest.fn().mockResolvedValue([]);

      const result = await service.getBatchById(ownBatch.id, mockDonorUser);

      expect(result.id).toBe(ownBatch.id);
      expect(result.childBatches).toEqual([]);
      expect(result.inspections).toEqual([]);
    });

    it('GET /:id denies an inspector an APPROVED batch outside the inspection workflow', async () => {
      const inspector: AuthUser = {
        id: '66666666-6666-6666-6666-666666666666',
        fullName: 'Insp. Eve',
        role: AppRole.INSPECTOR,
      };
      dbMock.queryOne.mockResolvedValueOnce(otherOrgBatch).mockResolvedValueOnce({ allowed: false });

      await expect(service.getBatchById(otherOrgBatch.id, inspector)).rejects.toThrow(NotFoundException);
    });

    it('GET /:id allows an inspector a pending_inspection batch via the workflow duty change', async () => {
      const inspector: AuthUser = {
        id: '66666666-6666-6666-6666-666666666666',
        fullName: 'Insp. Eve',
        role: AppRole.INSPECTOR,
      };
      const queuedBatch = { ...otherOrgBatch, status: FoodBatchStatus.PENDING_INSPECTION };
      // No org membership → isBatchReadableByUser short-circuits INSPECTOR branch
      dbMock.queryOne.mockResolvedValueOnce(queuedBatch);

      const result = await service.getBatchById(queuedBatch.id, inspector);
      expect(result.id).toBe(queuedBatch.id);
    });

    it('isBatchReadableByUser: volunteer with a delivery task relationship is allowed', async () => {
      const volunteer: AuthUser = {
        id: '77777777-7777-7777-7777-777777777777',
        fullName: 'Vic Volunteer',
        role: AppRole.VOLUNTEER,
      };
      dbMock.queryOne.mockResolvedValueOnce({ allowed: true });

      const allowed = await service.isBatchReadableByUser(otherOrgBatch.id, { status: 'allocated' }, volunteer);

      expect(allowed).toBe(true);
      const sql = dbMock.queryOne.mock.calls[0][0] as string;
      expect(sql).toContain('public.delivery_tasks dt');
      expect(sql).toContain('dt.volunteer_id = $2');
      expect(dbMock.queryOne.mock.calls[0][1]).toEqual([otherOrgBatch.id, volunteer.id]);
    });

    it('isBatchReadableByUser: org-less non-admin with no relationship is denied without a query', async () => {
      const outsider: AuthUser = {
        id: '88888888-8888-8888-8888-888888888888',
        fullName: 'Org-less Intruder',
        role: AppRole.DONOR,
      };

      const allowed = await service.isBatchReadableByUser(otherOrgBatch.id, { status: 'approved' }, outsider);

      expect(allowed).toBe(false);
      expect(dbMock.queryOne).not.toHaveBeenCalled();
    });

    it('GET /:id/history conceals another organisation batch history as 404', async () => {
      dbMock.queryOne.mockResolvedValueOnce(otherOrgBatch).mockResolvedValueOnce({ allowed: false });

      await expect(service.getBatchHistory(otherOrgBatch.id, mockDonorUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(safechainMock.getBatchEvents).not.toHaveBeenCalled();
    });

    it('GET /:id/history returns SafeChain events for a readable batch', async () => {
      const ownBatch = { ...otherOrgBatch, donor_organisation_id: mockDonorUser.organisationId };
      dbMock.queryOne
        .mockResolvedValueOnce(ownBatch)
        .mockResolvedValueOnce({ allowed: true });
      safechainMock.getBatchEvents.mockResolvedValueOnce([{ id: 'event-1' }]);

      const result = await service.getBatchHistory(ownBatch.id, mockDonorUser);

      expect(result).toEqual([{ id: 'event-1' }]);
      expect(safechainMock.getBatchEvents).toHaveBeenCalledWith(ownBatch.id);
    });

    it('GET /batches: org-less non-admin falls through to a deliberate 1 = 0 deny (never platform-wide)', async () => {
      const orgLessDonor: AuthUser = {
        id: '88888888-8888-8888-8888-888888888888',
        fullName: 'Org-less Donor',
        role: AppRole.DONOR,
      };
      const countParams: any[][] = [];
      dbMock.queryOne = jest.fn().mockImplementation((_sql: string, params?: any[]) => {
        countParams.push((params ?? []).slice());
        return Promise.resolve({ total: 0 });
      });
      dbMock.query = jest.fn().mockResolvedValue([]);

      const result = await service.listBatches({}, orgLessDonor);

      expect(result.data).toEqual([]);
      const countSql = dbMock.queryOne.mock.calls[0][0] as string;
      expect(countSql).toContain('1 = 0');
      // No organisation filter values beyond pagination were bound
      expect(countParams[0]).toEqual([]);
    });

    it('GET /batches: explicit donorOrganisationId can NEVER override the donor organisation scope', async () => {
      const maliciousQuery = { donorOrganisationId: '99999999-9999-9999-9999-999999999999' };
      dbMock.queryOne = jest.fn().mockResolvedValue({ total: 0 });
      dbMock.query = jest.fn().mockResolvedValue([]);

      await service.listBatches(maliciousQuery, mockDonorUser);

      const countSql = dbMock.queryOne.mock.calls[0][0] as string;
      const params = dbMock.queryOne.mock.calls[0][1] as any[];
      // Scope references the caller's OWN org (1st and 2nd bound values), not the spoofed one
      expect(params[0]).toBe(mockDonorUser.organisationId);
      expect(params[1]).toBe(mockDonorUser.organisationId);
      expect(params).not.toContain(maliciousQuery.donorOrganisationId);
      expect(countSql).toContain('donor_organisation_id = $1');
      expect(countSql).toContain('food_allocations dfa');
    });

    it('GET /batches: inspector retains the pending/hold inspection queue even without an org', async () => {
      const orgLessInspector: AuthUser = {
        id: '66666666-6666-6666-6666-666666666666',
        fullName: 'Insp. Queue',
        role: AppRole.INSPECTOR,
      };
      dbMock.queryOne = jest.fn().mockResolvedValue({ total: 1 });
      dbMock.query = jest.fn().mockResolvedValue([{ id: 'queued-batch' }]);

      const result = await service.listBatches({}, orgLessInspector);

      expect(result.data).toEqual([{ id: 'queued-batch' }]);
      const countSql = dbMock.queryOne.mock.calls[0][0] as string;
      expect(countSql).toContain('pending_inspection');
      expect(countSql).toContain('hold');
    });

    it('GET /batches: admin may still filter by arbitrary donorOrganisationId (platform policy)', async () => {
      const countParams: any[][] = [];
      dbMock.queryOne = jest.fn().mockImplementation((_sql: string, params?: any[]) => {
        countParams.push((params ?? []).slice());
        return Promise.resolve({ total: 0 });
      });
      dbMock.query = jest.fn().mockResolvedValue([]);

      await service.listBatches(
        { donorOrganisationId: '99999999-9999-9999-9999-999999999999' },
        mockAdminUser,
      );

      const countSql = dbMock.queryOne.mock.calls[0][0] as string;
      expect(countSql).toContain('donor_organisation_id = $1');
      expect(countParams[0]).toEqual(['99999999-9999-9999-9999-999999999999']);
    });
  });

  describe('Batch summary (Phase 0, Task F — donor dashboard)', () => {
    const summaryUser = mockDonorUser; // org 22222222-…

    it('rejects an organisation-less user with 403 (no arbitrary org id is accepted)', async () => {
      const orgLess: AuthUser = {
        id: '88888888-8888-8888-8888-888888888888',
        fullName: 'Org-less Donor',
        role: AppRole.DONOR,
      };

      await expect(
        service.getBatchSummary(orgLess),
      ).rejects.toThrow(ForbiddenException);
      expect(dbMock.queryOne).not.toHaveBeenCalled();
    });

    it('computes status counts and per-unit quantities from the database ledger without mixing units', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        total_batches: 5,
        pending_inspection: 2,
        on_hold: 1,
        approved: 1,
        partially_allocated: 1,
        allocated: 0,
        in_transit: 0,
        completed: 0,
        rejected: 0,
        expired: 0,
        cancelled: 0,
      });
      dbMock.query.mockResolvedValueOnce([
        {
          unit: 'kg',
          original_quantity: 120,
          reserved_quantity: 60,
          available_quantity: 60,
          delivered_quantity: 40,
          lost_quantity: 5,
        },
        {
          unit: 'portions',
          original_quantity: 30,
          reserved_quantity: 10,
          available_quantity: 20,
          delivered_quantity: 0,
          lost_quantity: 0,
        },
      ]);

      const result = await service.getBatchSummary(summaryUser);

      expect(result.organisationId).toBe(summaryUser.organisationId);
      expect(result.metrics.totalBatches).toBe(5);
      expect(result.metrics.pendingInspection).toBe(2);
      expect(result.metrics.onHold).toBe(1);
      expect(result.metrics.approved).toBe(1);
      expect(result.metrics.partiallyAllocated).toBe(1);
      expect(result.metrics.completedBatches).toBe(0);

      // kg and portions are kept as separate ledger groups — never summed
      expect(result.metrics.quantities).toHaveLength(2);
      const kg = result.metrics.quantities.find((q: any) => q.unit === 'kg');
      expect(kg).toMatchObject({
        originalQuantity: 120,
        reservedQuantity: 60,
        availableQuantity: 60,
        deliveredQuantity: 40,
        lostQuantity: 5,
      });

      // Scope + parent/child reconciliation enforced in SQL
      const countSql = dbMock.queryOne.mock.calls[0][0] as string;
      expect(countSql).toContain('donor_organisation_id = $1');
      expect(countSql).toContain('parent_batch_id IS NULL');
      const quantitySql = dbMock.query.mock.calls[0][0] as string;
      expect(quantitySql).toContain('donor_organisation_id = $1');
      expect(quantitySql).toContain('parent_batch_id IS NULL');
      expect(quantitySql).toContain('GROUP BY b.quantity_unit');
    });

    it('returns a zeroed contract for an organisation with no batches', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        total_batches: 0,
        pending_inspection: 0,
        on_hold: 0,
        approved: 0,
        partially_allocated: 0,
        allocated: 0,
        in_transit: 0,
        completed: 0,
        rejected: 0,
        expired: 0,
        cancelled: 0,
      });
      dbMock.query.mockResolvedValueOnce([]);

      const result = await service.getBatchSummary(summaryUser);

      expect(result.metrics.totalBatches).toBe(0);
      expect(result.metrics.pendingInspection).toBe(0);
      expect(result.metrics.quantities).toEqual([]);
    });

    it('never leaks another organisation: the caller org id is bound as the ONLY filter parameter', async () => {
      dbMock.queryOne = jest.fn().mockResolvedValue({
        total_batches: 0,
        pending_inspection: 0,
        on_hold: 0,
        approved: 0,
        partially_allocated: 0,
        allocated: 0,
        in_transit: 0,
        completed: 0,
        rejected: 0,
        expired: 0,
        cancelled: 0,
      });
      dbMock.query = jest.fn().mockResolvedValue([]);

      // The API accepts no org id argument at all — scope is server-derived
      await service.getBatchSummary(mockOtherUser);

      expect(dbMock.queryOne.mock.calls[0][1]).toEqual([mockOtherUser.organisationId]);
      expect(dbMock.query.mock.calls[0][1]).toEqual([mockOtherUser.organisationId]);
    });
  });
});
