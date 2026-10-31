import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganisationRepository } from '../repositories/organisation.repository.interface';
import { RecipientCapacityDto } from '../dto/recipient-capacity.dto';
import { FoodAcceptanceDto } from '../dto/food-acceptance.dto';
import { UpdateRecipientRequirementsDto } from '../dto/recipient-requirements.dto';
import { RecipientRequirements } from '../entities/recipient-requirements.entity';
import { FoodCategory } from '../enums/food-category.enum';

@Injectable()
export class RecipientRequirementsService {
  constructor(
    @Inject('ORGANISATION_REPOSITORY')
    private readonly orgRepository: IOrganisationRepository,
  ) {}

  async getRequirements(orgId: string): Promise<RecipientRequirements> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    const req = await this.orgRepository.findRecipientRequirements(orgId);
    if (!req) {
      throw new NotFoundException(
        `Recipient requirements have not been configured for organisation ${orgId}`,
      );
    }

    return req;
  }

  async updateCapacity(
    orgId: string,
    capacityDto: RecipientCapacityDto,
  ): Promise<RecipientRequirements> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    if (!capacityDto.quantityUnit || capacityDto.quantityUnit.trim() === '') {
      throw new BadRequestException('A valid quantity unit (e.g. kg, portions) is required.');
    }

    return this.orgRepository.upsertRecipientRequirements(orgId, {
      requestedQuantity: capacityDto.requestedQuantity,
      quantityUnit: capacityDto.quantityUnit.trim(),
      storageCapacityKg: capacityDto.storageCapacityKg,
      isActive: true,
    });
  }

  async updateFoodAcceptance(
    orgId: string,
    acceptanceDto: FoodAcceptanceDto,
  ): Promise<RecipientRequirements> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    if (
      !acceptanceDto.acceptedCategories ||
      acceptanceDto.acceptedCategories.length === 0
    ) {
      throw new BadRequestException(
        'At least one food category must be selected for acceptance.',
      );
    }

    // Food safety check: If accepting animal-appropriate food, ensure existing species config exists
    if (acceptanceDto.acceptedCategories.includes(FoodCategory.ANIMAL_APPROPRIATE)) {
      const existing = await this.orgRepository.findRecipientRequirements(orgId);
      if (
        !existing?.speciesRequirements?.targetSpecies ||
        existing.speciesRequirements.targetSpecies.length === 0
      ) {
        throw new BadRequestException(
          'Food Safety Rule Violation: Accepting animal-appropriate food requires explicitly defined target species. Please configure species requirements via PUT /api/v1/organisations/:id/recipient-requirements.',
        );
      }
    }

    return this.orgRepository.upsertRecipientRequirements(orgId, {
      acceptedCategories: acceptanceDto.acceptedCategories,
      isActive: true,
    });
  }

  async updateAllRequirements(
    orgId: string,
    dto: UpdateRecipientRequirementsDto,
  ): Promise<RecipientRequirements> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${orgId} not found`);
    }

    // Food safety validation:
    // Rule: Animal suitability must consider species-specific requirements.
    if (dto.acceptedCategories.includes(FoodCategory.ANIMAL_APPROPRIATE)) {
      if (
        !dto.speciesRequirements ||
        !dto.speciesRequirements.targetSpecies ||
        dto.speciesRequirements.targetSpecies.length === 0
      ) {
        throw new BadRequestException(
          'Food Safety Rule Violation: Accepting animal-appropriate food strictly requires specifying target animal species.',
        );
      }
    }

    // Explicit units validation
    if (!dto.quantityUnit || dto.quantityUnit.trim() === '') {
      throw new BadRequestException('A valid quantity unit (e.g. kg, portions) is required.');
    }

    return this.orgRepository.upsertRecipientRequirements(orgId, {
      acceptedCategories: dto.acceptedCategories,
      requestedQuantity: dto.requestedQuantity,
      quantityUnit: dto.quantityUnit.trim(),
      storageCapacityKg: dto.storageCapacityKg,
      dietaryRequirements: dto.dietaryRequirements,
      speciesRequirements: dto.speciesRequirements,
      specialRequirements: dto.specialRequirements,
      isActive: true,
    });
  }
}
