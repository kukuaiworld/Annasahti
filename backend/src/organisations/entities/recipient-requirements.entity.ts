import { FoodCategory } from '../enums/food-category.enum';

export interface StructuredDietaryRequirements {
  isVegetarianOnly?: boolean;
  isVeganOnly?: boolean;
  prohibitedAllergens?: string[];
  halalCertifiedRequired?: boolean;
  kosherCertifiedRequired?: boolean;
  customDietaryNotes?: string;
}

export interface StructuredSpeciesRequirements {
  targetSpecies: string[]; // e.g. ['canine', 'bovine', 'poultry']
  prohibitedIngredients?: string[]; // e.g. ['alliums', 'theobromine', 'xylitol']
  handlingInstructions?: string;
}

export class RecipientRequirements {
  id: string;
  organisationId: string;
  acceptedCategories: FoodCategory[];
  requestedQuantity: number;
  quantityUnit: string;
  storageCapacityKg?: number;
  dietaryRequirements?: StructuredDietaryRequirements;
  speciesRequirements?: StructuredSpeciesRequirements;
  specialRequirements?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
