import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../common/enums/app.enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { OperationalIntelligenceService } from './operational-intelligence.service';

describe('OperationalIntelligenceService', () => {
  let service: OperationalIntelligenceService;
  let dbMock: any;

  const mockAdminUser: AuthUser = {
    id: 'admin-uuid',
    email: 'admin@foodloop.org',
    fullName: 'Platform Admin',
    role: AppRole.ADMIN,
  };

  const mockDonorUser: AuthUser = {
    id: 'donor-user-uuid',
    email: 'donor@green-grocer.org',
    fullName: 'Green Grocer Manager',
    role: AppRole.DONOR,
    organisationId: 'org-green-grocer',
  };

  beforeEach(async () => {
    dbMock = {
      queryOne: jest.fn(),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationalIntelligenceService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<OperationalIntelligenceService>(
      OperationalIntelligenceService,
    );
  });

  describe('getOperationalSummary', () => {
    it('returns honest insufficient-data notice when fewer than 3 deliveries exist', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        total_deliveries: 1,
        delivered_count: 1,
        discrepancy_count: 0,
        cancelled_count: 0,
        in_progress_count: 0,
        total_received_quantity: 40,
        total_damaged_quantity: 0,
        total_missing_quantity: 0,
      });

      dbMock.query.mockResolvedValueOnce([
        {
          category: 'human_consumption',
          batch_count: 1,
          total_quantity: 40,
          quantity_unit: 'kg',
        },
      ]);

      const result = await service.getOperationalSummary({}, mockDonorUser);

      expect(result.dataType).toBe('measured_operational_data');
      expect(result.hasSufficientData).toBe(false);
      expect(result.notice).toContain('Insufficient operational history');
      expect(result.deliveries.total).toBe(1);
      expect(result.deliveries.fulfillmentRatePercent).toBe(100);
      expect(result.wastePatternsByCategory.length).toBe(1);
    });

    it('returns hasSufficientData: true when 3 or more operations are completed', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        total_deliveries: 4,
        delivered_count: 3,
        discrepancy_count: 1,
        cancelled_count: 0,
        in_progress_count: 0,
        total_received_quantity: 150,
        total_damaged_quantity: 5,
        total_missing_quantity: 0,
      });

      dbMock.query.mockResolvedValueOnce([]);

      const result = await service.getOperationalSummary({}, mockDonorUser);

      expect(result.hasSufficientData).toBe(true);
      expect(result.deliveries.completed).toBe(4);
      expect(result.deliveries.discrepancyRatePercent).toBe(25);
    });

    it('enforces tenant isolation and throws ForbiddenException when requesting another org', async () => {
      await expect(
        service.getOperationalSummary(
          { organisationId: 'other-org-uuid' },
          mockDonorUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to query arbitrary organisation or platform-wide', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        total_deliveries: 0,
        delivered_count: 0,
        discrepancy_count: 0,
        cancelled_count: 0,
        in_progress_count: 0,
        total_received_quantity: 0,
        total_damaged_quantity: 0,
        total_missing_quantity: 0,
      });
      dbMock.query.mockResolvedValueOnce([]);

      const result = await service.getOperationalSummary(
        { organisationId: 'any-org-uuid' },
        mockAdminUser,
      );

      expect(result.scope.organisationId).toBe('any-org-uuid');
    });
  });

  describe('getBottlenecks', () => {
    it('returns measured bottleneck counts and operational lead times', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        stale_uninspected_batches: 2,
        batches_on_hold: 1,
        delayed_unpicked_deliveries: 3,
        delayed_in_transit_deliveries: 0,
        avg_hours_to_inspect: 2.4,
        avg_hours_to_pickup: 3.1,
        avg_hours_in_transit: 1.2,
      });

      const result = await service.getBottlenecks(mockDonorUser);

      expect(result.dataType).toBe('measured_operational_data');
      expect(result.activeBottlenecks.staleUninspectedBatches).toBe(2);
      expect(result.activeBottlenecks.batchesOnHold).toBe(1);
      expect(result.leadTimesHours.averageInspectionHours).toBe(2.4);
      expect(result.leadTimesHours.averageTransitHours).toBe(1.2);
    });
  });
});
