/**
 * FoodLoop Food Safety Guidelines & Inspection Types
 *
 * CRITICAL FOOD SAFETY RULES:
 * 1. AI or client heuristics must NEVER approve food safety for human or animal consumption.
 * 2. Food must remain in HOLD / PENDING_INSPECTION status until an authorized human
 *    food safety inspector records an explicit decision via the backend API.
 * 3. Human consumption and animal suitability are strictly separate decisions.
 * 4. Animal suitability must consider species-specific nutritional and toxicological requirements.
 *    (e.g., allium/onions, cacao/chocolate, high spices are toxic to dogs/cattle).
 * 5. Spoiled, contaminated, or temperature-abused food must NEVER be automatically
 *    diverted to animal consumption.
 */

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

export interface HumanInspectionChecklist {
  batchId: string;
  temperatureCelsius?: number;
  packagingIntact: boolean;
  visualCheckPassed: boolean;
  odourCheckPassed: boolean;
  handlingNotes?: string;
  decision: InspectionDecision;
  targetSpecies?: AnimalSpecies[];
  rejectionReason?: string;
}

/**
 * Validates that an inspection record conforms to human safety verification rules
 * before transmission to the backend inspection endpoint.
 */
export function validateHumanInspection(data: HumanInspectionChecklist): {
  isValid: boolean;
  error?: string;
} {
  if (!data.batchId) {
    return { isValid: false, error: 'Batch ID is required for inspection.' };
  }

  // Enforce human decision requirement
  if (!data.decision || data.decision === InspectionDecision.PENDING) {
    return { isValid: false, error: 'An explicit authorized human inspection decision is required.' };
  }

  // Unsafe food cannot be routed to animal consumption
  if (
    data.decision === InspectionDecision.APPROVED_ANIMAL &&
    (!data.visualCheckPassed || !data.odourCheckPassed)
  ) {
    return {
      isValid: false,
      error: 'Spoiled or contaminated food failing visual or odour checks must NEVER be routed to animal consumption.',
    };
  }

  // Animal suitability requires explicit target species consideration
  if (
    data.decision === InspectionDecision.APPROVED_ANIMAL &&
    (!data.targetSpecies || data.targetSpecies.length === 0)
  ) {
    return {
      isValid: false,
      error: 'Animal suitability requires selecting verified target species to prevent species-specific poisoning.',
    };
  }

  // Rejection requires explicit documentation
  if (data.decision === InspectionDecision.REJECTED && !data.rejectionReason) {
    return {
      isValid: false,
      error: 'A detailed rejection reason is required for any rejected batch.',
    };
  }

  return { isValid: true };
}
