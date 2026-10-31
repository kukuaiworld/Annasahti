import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecipientRequirementsService } from './recipient-requirements.service';
import { InMemoryOrganisationRepository } from '../repositories/in-memory-organisation.repository';
import { OrganisationType } from '../enums/organisation-type.enum';
import { FoodCategory } from '../enums/food-category.enum';

describe('RecipientRequirementsService', () => {
  let service: RecipientRequirementsService;
  let repo: InMemoryOrganisationRepository;
  let orgId: string;

  beforeEach(async () => {
    repo = new InMemoryOrganisationRepository();
    service = new RecipientRequirementsService(repo);

    const org = await repo.createOrganisation({
      name: 'Community Care',
      organisationType: OrganisationType.HUMANITARIAN_NGO,
    });
    orgId = org.id;
  });

  describe('updateCapacity', () => {
    it('should configure capacity with explicit quantity and units', async () => {
      const result = await service.updateCapacity(orgId, {
        requestedQuantity: 250,
        quantityUnit: 'kg',
        storageCapacityKg: 500,
      });

      expect(result.organisationId).toBe(orgId);
      expect(result.requestedQuantity).toBe(250);
      expect(result.quantityUnit).toBe('kg');
      expect(result.storageCapacityKg).toBe(500);
    });

    it('should throw BadRequestException if quantity unit is missing or empty', async () => {
      await expect(
        service.updateCapacity(orgId, {
          requestedQuantity: 100,
          quantityUnit: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if organisation does not exist', async () => {
      await expect(
        service.updateCapacity('non-existent-org', {
          requestedQuantity: 100,
          quantityUnit: 'portions',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFoodAcceptance and Food Safety', () => {
    it('should update accepted categories for human consumption', async () => {
      const result = await service.updateFoodAcceptance(orgId, {
        acceptedCategories: [FoodCategory.HUMAN_CONSUMPTION],
      });

      expect(result.acceptedCategories).toEqual([FoodCategory.HUMAN_CONSUMPTION]);
    });

    it('FOOD SAFETY: should reject animal food acceptance if species are not configured', async () => {
      await expect(
        service.updateFoodAcceptance(orgId, {
          acceptedCategories: [FoodCategory.ANIMAL_APPROPRIATE],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAllRequirements', () => {
    it('FOOD SAFETY: should reject animal food if species requirements are missing', async () => {
      await expect(
        service.updateAllRequirements(orgId, {
          acceptedCategories: [FoodCategory.ANIMAL_APPROPRIATE],
          requestedQuantity: 50,
          quantityUnit: 'kg',
          speciesRequirements: {
            targetSpecies: [], // Empty species!
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('FOOD SAFETY: should accept animal food when target species are explicitly defined', async () => {
      const result = await service.updateAllRequirements(orgId, {
        acceptedCategories: [FoodCategory.ANIMAL_APPROPRIATE],
        requestedQuantity: 50,
        quantityUnit: 'kg',
        speciesRequirements: {
          targetSpecies: ['canine', 'feline'],
          prohibitedIngredients: ['alliums', 'theobromine'],
          handlingInstructions: 'Keep dry kibble sealed',
        },
      });

      expect(result.acceptedCategories).toEqual([FoodCategory.ANIMAL_APPROPRIATE]);
      expect(result.speciesRequirements?.targetSpecies).toEqual(['canine', 'feline']);
      expect(result.speciesRequirements?.prohibitedIngredients).toContain('theobromine');
    });

    it('should configure human dietary requirements', async () => {
      const result = await service.updateAllRequirements(orgId, {
        acceptedCategories: [FoodCategory.HUMAN_CONSUMPTION],
        requestedQuantity: 100,
        quantityUnit: 'portions',
        dietaryRequirements: {
          isVegetarianOnly: true,
          prohibitedAllergens: ['peanuts', 'shellfish'],
          halalCertifiedRequired: false,
          customDietaryNotes: 'Elderly care with soft meals',
        },
      });

      expect(result.acceptedCategories).toEqual([FoodCategory.HUMAN_CONSUMPTION]);
      expect(result.dietaryRequirements?.isVegetarianOnly).toBe(true);
      expect(result.dietaryRequirements?.prohibitedAllergens).toEqual(['peanuts', 'shellfish']);
    });
  });
});
