export enum AppRole {
  DONOR = 'donor',
  RECIPIENT = 'recipient',
  VOLUNTEER = 'volunteer',
  INSPECTOR = 'inspector',
  ADMIN = 'admin',
}

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

export enum InspectionDecision {
  PENDING = 'pending',
  APPROVED_HUMAN = 'approved_human',
  APPROVED_ANIMAL = 'approved_animal',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review',
  APPROVED_ORGANIC_WASTE = 'approved_organic_waste',
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
