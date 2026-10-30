import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AnimalSpecies, AppRole, FoodBatchStatus, InspectionDecision } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('InspectionsService', () => {
  let service: InspectionsService;
  let dbMock: any;
  let safechainMock: any;

  const mockInspectorUser: AuthUser = {
    id: 'inspector-uuid-1',
    fullName: 'Dr. Jane Smith, Food Safety Officer',
    role: AppRole.INSPECTOR,
  };

  const mockDonorUser: AuthUser = {
    id: 'donor-uuid-1',
    fullName: 'Restaurant Manager',
    role: AppRole.DONOR,
  };

  const pendingBatch = {
    id: 'batch-uuid-pending',
    batch_code: 'FL-INSPECT01',
    donor_organisation_id: 'org-uuid-1',
    food_name: 'Prepared Chicken Sandwiches',
    quantity: 30,
    quantity_unit: 'portion',
    status: FoodBatchStatus.PENDING_INSPECTION,
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };

    safechainMock = {
      recordEvent: jest.fn().mockResolvedValue({ id: 'event-uuid' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionsService,
        { provide: DatabaseService, useValue: dbMock },
        { provide: SafeChainService, useValue: safechainMock },
      ],
    }).compile();

    service = module.get<InspectionsService>(InspectionsService);
  });

  describe('recordInspection', () => {
    it('should successfully record human inspector decision and emit SafeChain events', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(pendingBatch) // batch lookup
        .mockResolvedValueOnce({
          id: 'inspection-uuid-1',
          batch_id: pendingBatch.id,
          inspector_id: mockInspectorUser.id,
          decision: InspectionDecision.APPROVED_HUMAN,
          human_verified: true,
          is_ai_assessed: false,
        }); // insert return

      const result = await service.recordInspection(
        {
          batchId: pendingBatch.id,
          decision: InspectionDecision.APPROVED_HUMAN,
          temperatureC: 3.5,
          packagingCondition: 'Intact food-grade sealed trays',
          appearanceCondition: 'Fresh',
          odourCondition: 'Normal',
          evidenceUrls: ['https://storage.foodloop.org/evidence/batch1.jpg'],
          isAiAssessed: false,
          humanVerified: true,
        },
        mockInspectorUser,
      );

      expect(result.id).toBe('inspection-uuid-1');
      expect(result.decision).toBe(InspectionDecision.APPROVED_HUMAN);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          batchId: pendingBatch.id,
          eventType: 'inspection_completed',
        }),
      );
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          batchId: pendingBatch.id,
          eventType: 'batch_approved',
        }),
      );
    });

    it('FOOD SAFETY INVARIANT: should reject AI auto-approval without human verification', async () => {
      await expect(
        service.recordInspection(
          {
            batchId: pendingBatch.id,
            decision: InspectionDecision.APPROVED_HUMAN,
            isAiAssessed: true,
            humanVerified: false, // AI attempted to approve autonomously!
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SPECIES INVARIANT: should reject approved_animal decision without target species', async () => {
      await expect(
        service.recordInspection(
          {
            batchId: pendingBatch.id,
            decision: InspectionDecision.APPROVED_ANIMAL,
            humanVerified: true,
            isAiAssessed: false,
            targetSpecies: [], // Empty species list!
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('ROLE INVARIANT: should reject inspection recorded by non-inspector', async () => {
      await expect(
        service.recordInspection(
          {
            batchId: pendingBatch.id,
            decision: InspectionDecision.APPROVED_HUMAN,
            humanVerified: true,
            isAiAssessed: false,
          },
          mockDonorUser, // Donor role, not Inspector!
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject inspection on non-existent batch', async () => {
      dbMock.queryOne.mockResolvedValueOnce(null);

      await expect(
        service.recordInspection(
          {
            batchId: 'non-existent-batch',
            decision: InspectionDecision.REJECTED,
            rejectionReason: 'Spoiled odour',
            humanVerified: true,
            isAiAssessed: false,
          },
          mockInspectorUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record rejected inspection and log rejection SafeChain event', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(pendingBatch)
        .mockResolvedValueOnce({
          id: 'inspection-uuid-rej',
          batch_id: pendingBatch.id,
          decision: InspectionDecision.REJECTED,
          rejectionReason: 'Temperature abuse > 15C',
        });

      const res = await service.recordInspection(
        {
          batchId: pendingBatch.id,
          decision: InspectionDecision.REJECTED,
          rejectionReason: 'Temperature abuse > 15C',
          temperatureC: 16.2,
          humanVerified: true,
          isAiAssessed: false,
        },
        mockInspectorUser,
      );

      expect(res.decision).toBe(InspectionDecision.REJECTED);
      expect(safechainMock.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'batch_rejected',
        }),
      );
    });
  });

  describe('getInspectionQueue', () => {
    it('should return paginated inspection queue for batches pending review', async () => {
      dbMock.queryOne.mockResolvedValue({ total: 1 });
      dbMock.query.mockResolvedValue([pendingBatch]);

      const res = await service.getInspectionQueue({ page: 1, limit: 10 }, mockInspectorUser);
      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });
});
