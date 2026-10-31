export enum FoodCategory {
  HUMAN_CONSUMPTION = 'human_consumption',
  ANIMAL_APPROPRIATE = 'animal_appropriate',
  ORGANIC_WASTE = 'organic_waste',
}

export enum FoodBatchStatus {
  PENDING_INSPECTION = 'pending_inspection',
  APPROVED = 'approved',
  PARTIALLY_ALLOCATED = 'partially_allocated',
  ALLOCATED = 'allocated',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  HOLD = 'hold',
}

export enum QuantityUnit {
  KG = 'kg',
  PORTIONS = 'portions',
  BOXES = 'boxes',
  CRATES = 'crates',
  LITRES = 'litres',
  TRAYS = 'trays',
}

export enum AnimalSpecies {
  CANINE = 'canine',
  FELINE = 'feline',
  BOVINE = 'bovine',
  PORCINE = 'porcine',
  POULTRY = 'poultry',
  EQUINE = 'equine',
  OTHER = 'other',
}

export interface FoodBatchRecord {
  id: string;
  batch_code: string;
  donor_organisation_id: string;
  food_name: string;
  description?: string;
  category?: FoodCategory;
  quantity: number;
  quantity_unit: string;
  estimated_weight_kg?: number;
  prepared_at?: string;
  best_before_at?: string;
  pickup_deadline?: string;
  storage_instructions?: string;
  status: FoodBatchStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  parent_batch_id?: string;
  allocated_quantity: number;
  delivered_quantity: number;
  damaged_quantity: number;
  missing_quantity: number;
  available_quantity: number;
  donor_name?: string;
  donor_address?: string;
}

export interface CreateFoodBatchDto {
  donorOrganisationId: string;
  foodName: string;
  description?: string;
  quantity: number;
  quantityUnit: string;
  estimatedWeightKg?: number;
  preparedAt?: string;
  bestBeforeAt?: string;
  pickupDeadline?: string;
  storageInstructions?: string;
}

export interface UpdateFoodBatchDto {
  foodName?: string;
  description?: string;
  quantity?: number;
  quantityUnit?: string;
  estimatedWeightKg?: number;
  preparedAt?: string;
  bestBeforeAt?: string;
  pickupDeadline?: string;
  storageInstructions?: string;
}

export interface SplitBatchDto {
  childBatches: Array<{
    quantity: number;
    description?: string;
  }>;
}

export interface BatchQueryDto {
  page?: number;
  limit?: number;
  status?: FoodBatchStatus;
  category?: FoodCategory;
  donorOrganisationId?: string;
  expiryAfter?: string;
  pickupBefore?: string;
  search?: string;
}

export interface FoodBatchDetail extends FoodBatchRecord {
  childBatches?: FoodBatchRecord[];
  parentBatch?: FoodBatchRecord | null;
  inspections?: Array<{
    id: string;
    batch_id: string;
    inspector_id: string;
    inspector_name?: string;
    decision: string;
    temperature_c?: number;
    packaging_condition?: string;
    appearance_condition?: string;
    odour_condition?: string;
    handling_notes?: string;
    rejection_reason?: string;
    created_at: string;
  }>;
}

export interface SafeChainEvent {
  id: string;
  batchId: string;
  eventType: string;
  eventHash: string;
  previousHash?: string;
  payload: Record<string, any>;
  timestamp: string;
  actorId?: string;
}
