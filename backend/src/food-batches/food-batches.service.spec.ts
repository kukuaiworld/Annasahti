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
      transaction: jest.fn((callback) => callback(dbMock)),
    };

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
});
