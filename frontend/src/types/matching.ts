import { AnimalSpecies, FoodCategory } from './batches';

export interface MatchResult {
  recipientOrganisationId: string;
  recipientName: string;
  organisationType: string;
  address?: string;
  isEligible: boolean;
  exclusionReasons: string[];
  matchScore: number;
  distanceKm: number | null;
  batchAvailableQuantity: number;
  recipientRequestedQuantity: number;
  recipientStorageCapacityKg: number | null;
  quantityUnit: string;
  warnings: string[];
  factors: string[];
}

export interface BatchMatchesResponse {
  batch: {
    id: string;
    batchCode: string;
    foodName: string;
    category: FoodCategory;
    availableQuantity: number;
    quantityUnit: string;
    pickupDeadline?: string;
    donorName: string;
  };
  matches: MatchResult[];
}

export interface MatchQueryDto {
  maxDistanceKm?: number;
  limit?: number;
}

export interface RecipientSearchDto {
  category?: FoodCategory;
  species?: AnimalSpecies;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

export interface EligibleRecipient {
  organisation_id: string;
  organisation_name: string;
  organisation_type: string;
  address?: string;
  accepted_categories: FoodCategory[];
  supported_species?: AnimalSpecies[];
  requested_quantity: number;
  quantity_unit: string;
  storage_capacity_kg?: number | null;
  distance_km?: number | null;
}
