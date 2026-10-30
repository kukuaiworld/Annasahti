import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ImpactService } from './impact.service';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('ImpactService', () => {
  let service: ImpactService;
  let dbMock: any;

  const mockAdminUser: AuthUser = {
    id: 'admin-uuid',
    fullName: 'Platform Admin',
    role: AppRole.ADMIN,
  };

  const mockOrgUser: AuthUser = {
    id: 'donor-user-uuid',
    fullName: 'Chef Maria',
    role: AppRole.DONOR,
    organisationId: 'org-metro-kitchen',
  };

  const mockOtherUser: AuthUser = {
    id: 'intruder-uuid',
    fullName: 'Intruder',
    role: AppRole.DONOR,
    organisationId: 'org-other-kitchen',
  };

  const mockMealMethodology = {
    id: 'method-1',
    methodology_code: 'MEAL_EQUIVALENT_GFN_V1',
    version: '1.0.0',
    assumptions: { kg_per_meal: 0.42 },
    is_active: true,
  };

  const mockCo2eMethodology = {
    id: 'method-2',
    methodology_code: 'CO2E_AVOIDED_EPA_WARM_V1',
    version: '1.0.0',
    assumptions: {
      human_food_diversion_kg_co2e_per_kg: 2.5,
      animal_feed_diversion_kg_co2e_per_kg: 2.1,
      composting_diversion_kg_co2e_per_kg: 0.52,
    },
    is_active: true,
    created_at: new Date(),
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<ImpactService>(ImpactService);
  });

  describe('getOverview', () => {
    it('should aggregate completed human food, animal food, organic waste, meals, and estimated CO2e', async () => {
      // 1. meal methodology
      // 2. co2e methodology
      // 3. delivery aggregation
      // 4. waste aggregation
      dbMock.queryOne
        .mockResolvedValueOnce(mockMealMethodology)
        .mockResolvedValueOnce(mockCo2eMethodology)
        .mockResolvedValueOnce({
          human_delivered_kg: '84.0', // 84 kg / 0.42 = 200 meals
          ngo_delivered_kg: '60.0',
          other_human_delivered_kg: '24.0',
          animal_delivered_kg: '50.0',
          animal_deliveries_count: 2,
          total_deliveries_count: 5,
          total_damaged_kg: '2.5',
          total_missing_kg: '1.5',
        })
        .mockResolvedValueOnce({
          waste_processed_kg: '100.0',
          waste_records_count: 3,
        });

      const overview = await service.getOverview({}, mockAdminUser);

      // Verify human food delivered and meal equivalent
      expect(overview.metrics.humanFoodDeliveredKg.value).toBe(84);
      expect(overview.metrics.humanFoodDeliveredKg.ngoSpecificKg).toBe(60);
      expect(overview.metrics.humanFoodDeliveredKg.otherHumanitarianKg).toBe(24);
      expect(overview.metrics.mealsRescued.value).toBe(200);
      expect(overview.metrics.mealsRescued.status).toBe('calculated');

      // Verify animal-appropriate food
      expect(overview.metrics.animalAppropriateFoodKg.value).toBe(50);
      expect(overview.metrics.animalAppropriateFoodKg.deliveriesCount).toBe(2);

      // Verify organic waste
      expect(overview.metrics.organicWasteProcessedKg.value).toBe(100);
      expect(overview.metrics.organicWasteProcessedKg.recordsCount).toBe(3);

      // Verify successful deliveries count
      expect(overview.metrics.successfulDeliveriesCount.value).toBe(5);

      // Verify CO2e avoided: (84 * 2.5) + (50 * 2.1) + (100 * 0.52) = 210 + 105 + 52 = 367 kg CO2e
      expect(overview.metrics.co2eAvoidedKg.value).toBe(367);
      expect(overview.metrics.co2eAvoidedKg.isEstimate).toBe(true);

      // Verify data quality reconciliation
      expect(overview.dataQuality.damagedQuantityKg).toBe(2.5);
      expect(overview.dataQuality.missingQuantityKg).toBe(1.5);
      expect(overview.dataQuality.unreconciledLossKg).toBe(4);
    });

    it('should report meals as unavailable if conversion methodology is not active', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce(null) // no meal methodology
        .mockResolvedValueOnce(mockCo2eMethodology)
        .mockResolvedValueOnce({
          human_delivered_kg: '50.0',
          ngo_delivered_kg: '50.0',
          other_human_delivered_kg: '0.0',
          animal_delivered_kg: '0.0',
          animal_deliveries_count: 0,
          total_deliveries_count: 1,
          total_damaged_kg: '0',
          total_missing_kg: '0',
        })
        .mockResolvedValueOnce({
          waste_processed_kg: '0',
          waste_records_count: 0,
        });

      const overview = await service.getOverview({}, mockAdminUser);

      expect(overview.metrics.mealsRescued.value).toBeNull();
      expect(overview.metrics.mealsRescued.status).toBe('unavailable');
      expect(overview.metrics.humanFoodDeliveredKg.value).toBe(50);
    });

    it('should reject requests with invalid date range where startDate > endDate', async () => {
      await expect(
        service.getOverview(
          { startDate: '2026-12-31', endDate: '2026-01-01' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should forbid non-admin users from accessing another organisation analytics', async () => {
      await expect(
        service.getOverview(
          { organisationId: 'org-another-kitchen' },
          mockOrgUser, // mockOrgUser belongs to 'org-metro-kitchen'
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTrends', () => {
    it('should return monthly grouped trend points with zero-filled continuity', async () => {
      const mockDeliveryRows = [
        {
          period_key: '2026-01',
          period_start: '2026-01-01T00:00:00.000Z',
          period_end: '2026-01-31T23:59:59.000Z',
          human_kg: '42.0',
          animal_kg: '20.0',
          deliveries_count: 2,
        },
      ];

      const mockWasteRows = [
        {
          period_key: '2026-01',
          waste_kg: '50.0',
        },
        {
          period_key: '2026-02',
          waste_kg: '70.0',
        },
      ];

      dbMock.query
        .mockResolvedValueOnce(mockDeliveryRows)
        .mockResolvedValueOnce(mockWasteRows);

      const result = await service.getTrends({ period: 'monthly' }, mockAdminUser);

      expect(result.series.length).toBe(2);
      expect(result.series[0].periodKey).toBe('2026-01');
      expect(result.series[0].humanFoodDeliveredKg).toBe(42);
      expect(result.series[0].mealsRescued).toBe(100); // 42 / 0.42 = 100
      expect(result.series[0].organicWasteProcessedKg).toBe(50);

      // Period 2 (waste only)
      expect(result.series[1].periodKey).toBe('2026-02');
      expect(result.series[1].humanFoodDeliveredKg).toBe(0);
      expect(result.series[1].organicWasteProcessedKg).toBe(70);
    });
  });

  describe('getCategoriesBreakdown', () => {
    it('should return mutually exclusive category totals and percentages', async () => {
      dbMock.query.mockResolvedValueOnce([
        { category: 'human_consumption', total_kg: '300.0', count: 10 },
        { category: 'animal_appropriate', total_kg: '150.0', count: 5 },
      ]);

      dbMock.queryOne.mockResolvedValueOnce({
        waste_kg: '50.0',
        waste_count: 2,
      });

      const result = await service.getCategoriesBreakdown({}, mockAdminUser);

      // Total diversion = 300 + 150 + 50 = 500 kg
      expect(result.totalDiversionKg).toBe(500);
      expect(result.categories.humanConsumption.totalKg).toBe(300);
      expect(result.categories.humanConsumption.percentage).toBe(60);
      expect(result.categories.animalAppropriate.totalKg).toBe(150);
      expect(result.categories.animalAppropriate.percentage).toBe(30);
      expect(result.categories.organicWaste.totalKg).toBe(50);
      expect(result.categories.organicWaste.percentage).toBe(10);
      expect(result.duplicatePreventionNotice).toBeDefined();
    });
  });

  describe('getOrganisationImpact', () => {
    it('should allow members of the organisation to view its impact', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({
          id: 'org-metro-kitchen',
          name: 'Metro Kitchen',
          organisation_type: 'restaurant',
          verification_status: 'verified',
        })
        .mockResolvedValueOnce(mockMealMethodology)
        .mockResolvedValueOnce(mockCo2eMethodology)
        .mockResolvedValueOnce({
          human_delivered_kg: '42.0',
          ngo_delivered_kg: '42.0',
          other_human_delivered_kg: '0.0',
          animal_delivered_kg: '0.0',
          animal_deliveries_count: 0,
          total_deliveries_count: 2,
          total_damaged_kg: '0',
          total_missing_kg: '0',
        })
        .mockResolvedValueOnce({
          waste_processed_kg: '0',
          waste_records_count: 0,
        })
        .mockResolvedValueOnce({ name: 'Metro Kitchen' });

      dbMock.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getOrganisationImpact(
        'org-metro-kitchen',
        {},
        mockOrgUser,
      );

      expect(result.organisation.name).toBe('Metro Kitchen');
      expect(result.overview.metrics.humanFoodDeliveredKg.value).toBe(42);
    });

    it('should forbid other organisation members from viewing', async () => {
      await expect(
        service.getOrganisationImpact(
          'org-metro-kitchen',
          {},
          mockOtherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMetricDefinitions and getCo2eMethodology', () => {
    it('should return documented metric definitions', async () => {
      const defs = await service.getMetricDefinitions();
      expect(defs.length).toBeGreaterThanOrEqual(5);
      const mealsDef = defs.find((d) => d.metricKey === 'meals_rescued');
      expect(mealsDef).toBeDefined();
      expect(mealsDef!.methodologyCode).toBe('MEAL_EQUIVALENT_GFN_V1');
    });

    it('should return active CO2e methodology with EPA WARM assumptions', async () => {
      dbMock.queryOne.mockResolvedValueOnce(mockCo2eMethodology);

      const method = await service.getCo2eMethodology();
      expect(method.methodologyCode).toBe('CO2E_AVOIDED_EPA_WARM_V1');
      expect(method.assumptions.human_food_diversion_kg_co2e_per_kg).toBe(2.5);
    });
  });
});
