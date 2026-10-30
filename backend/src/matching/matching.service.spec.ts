import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { DatabaseService } from '../database/database.service';
import {
  AppRole,
  FoodBatchStatus,
  FoodCategory,
  AnimalSpecies,
} from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('MatchingService', () => {
  let service: MatchingService;
  let dbMock: any;

  const mockUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Admin User',
    role: AppRole.ADMIN,
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn((cb) => cb(dbMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('findMatchesForBatch', () => {
    it('should throw NotFoundException if batch does not exist', async () => {
      dbMock.queryOne.mockResolvedValue(null);

      await expect(service.findMatchesForBatch('non-existent-id', {}, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if batch is in unverified state (PENDING_INSPECTION)', async () => {
      dbMock.queryOne.mockResolvedValue({
        id: 'batch-1',
        status: FoodBatchStatus.PENDING_INSPECTION,
        food_name: 'Raw Rice',
        category: null,
      });

      await expect(service.findMatchesForBatch('batch-1', {}, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return matching human recipient organisations with distance and capacity score', async () => {
      const mockBatch = {
        id: 'batch-1',
        batch_code: 'FL-2026-0001',
        donor_organisation_id: 'donor-org-uuid',
        food_name: 'Nutritious Curry',
        category: FoodCategory.HUMAN_CONSUMPTION,
        available_quantity: 40,
        quantity_unit: 'kg',
        status: FoodBatchStatus.APPROVED,
        storage_condition: 'cold',
        expiry_date: new Date(Date.now() + 3600000 * 24).toISOString(),
        pickup_deadline: new Date(Date.now() + 3600000 * 6).toISOString(),
      };

      const mockRecipients = [
        {
          organisation_id: 'recip-1',
          organisation_name: 'Community Food Shelter',
          organisation_type: 'humanitarian_ngo',
          verification_status: 'verified',
          operating_hours: { monday: '09:00-18:00' },
          storage_capacity_kg: 100,
          requested_quantity: 40,
          quantity_unit: 'kg',
          accepted_categories: [FoodCategory.HUMAN_CONSUMPTION],
          dietary_prohibitions: [],
          supported_species: [],
          distance_km: 3.5,
          has_coordinates: true,
        },
      ];

      // 1st queryOne: batch
      // 2nd queryOne: inspection (for species if applicable)
      dbMock.queryOne.mockResolvedValueOnce(mockBatch).mockResolvedValueOnce(null);
      dbMock.query.mockResolvedValueOnce(mockRecipients);

      const result = await service.findMatchesForBatch('batch-1', { maxDistanceKm: 15 }, mockUser);

      expect(result.batch.id).toBe('batch-1');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].isEligible).toBe(true);
      expect(result.matches[0].distanceKm).toBe(3.5);
      expect(result.matches[0].matchScore).toBeGreaterThan(50);
      expect(result.matches[0].factors).toContain('Compatible destination: Human Consumption');
    });

    it('should enforce species-specific suitability for animal-appropriate food', async () => {
      const mockAnimalBatch = {
        id: 'batch-animal-1',
        batch_code: 'FL-2026-0002',
        donor_organisation_id: 'donor-org-uuid',
        food_name: 'Cracked Wheat Grains',
        category: FoodCategory.ANIMAL_APPROPRIATE,
        available_quantity: 100,
        quantity_unit: 'kg',
        status: FoodBatchStatus.APPROVED,
        storage_condition: 'ambient',
      };

      const mockRecipients = [
        {
          organisation_id: 'recip-dog-shelter',
          organisation_name: 'City Dog Sanctuary',
          organisation_type: 'animal_welfare_ngo',
          verification_status: 'verified',
          accepted_categories: [FoodCategory.ANIMAL_APPROPRIATE],
          supported_species: [AnimalSpecies.CANINE],
          storage_capacity_kg: 200,
          requested_quantity: 50,
          quantity_unit: 'kg',
          distance_km: 5.0,
        },
        {
          organisation_id: 'recip-cattle-farm',
          organisation_name: 'Goshala Care Trust',
          organisation_type: 'animal_welfare_ngo',
          verification_status: 'verified',
          accepted_categories: [FoodCategory.ANIMAL_APPROPRIATE],
          supported_species: [AnimalSpecies.BOVINE],
          storage_capacity_kg: 500,
          requested_quantity: 100,
          quantity_unit: 'kg',
          distance_km: 8.0,
        },
      ];

      dbMock.queryOne
        .mockResolvedValueOnce(mockAnimalBatch)
        .mockResolvedValueOnce({ target_species: [AnimalSpecies.BOVINE] });
      dbMock.query.mockResolvedValueOnce(mockRecipients);

      const result = await service.findMatchesForBatch('batch-animal-1', {}, mockUser);

      expect(result.matches.length).toBe(2);

      const dogMatch = result.matches.find((m) => m.recipientOrganisationId === 'recip-dog-shelter');
      expect(dogMatch).toBeDefined();
      expect(dogMatch!.isEligible).toBe(false);
      expect(dogMatch!.exclusionReasons.some((r) => r.includes('SPECIES INCOMPATIBLE'))).toBe(true);

      const cattleMatch = result.matches.find((m) => m.recipientOrganisationId === 'recip-cattle-farm');
      expect(cattleMatch).toBeDefined();
      expect(cattleMatch!.isEligible).toBe(true);
      expect(cattleMatch!.factors.some((f) => f.includes('Species suitability verified'))).toBe(true);
    });

    it('should flag warning when recipient coordinates are missing rather than pretending distance is valid', async () => {
      const mockBatch = {
        id: 'batch-3',
        batch_code: 'FL-2026-0003',
        donor_organisation_id: 'donor-org-uuid',
        food_name: 'Apples',
        category: FoodCategory.HUMAN_CONSUMPTION,
        available_quantity: 50,
        quantity_unit: 'kg',
        status: FoodBatchStatus.APPROVED,
        storage_condition: 'ambient',
      };

      const mockRecipients = [
        {
          organisation_id: 'recip-no-coords',
          organisation_name: 'Rural Relief Center',
          organisation_type: 'humanitarian_ngo',
          verification_status: 'verified',
          accepted_categories: [FoodCategory.HUMAN_CONSUMPTION],
          supported_species: [],
          storage_capacity_kg: 50,
          requested_quantity: 50,
          quantity_unit: 'kg',
          distance_km: null,
        },
      ];

      dbMock.queryOne.mockResolvedValueOnce(mockBatch).mockResolvedValueOnce(null);
      dbMock.query.mockResolvedValueOnce(mockRecipients);

      const result = await service.findMatchesForBatch('batch-3', {}, mockUser);

      expect(result.matches[0].distanceKm).toBeNull();
      expect(
        result.matches[0].warnings.some((w) => w.includes('Missing geographic coordinates')),
      ).toBe(true);
    });
  });
});
