import { describe, it, expect } from 'vitest';
import { AnimalSpecies, InspectionDecision } from '@/types/inspections';
import { FoodBatchStatus } from '@/types/batches';

/**
 * Inspection Safety Invariants Rulebook Verification
 * Corresponds to FoodLoop strict safety principles:
 * 1. AI cannot approve food for human or animal consumption without human verification.
 * 2. Animal suitability must specify target species (canine, feline, bovine, etc.).
 * 3. Human and animal suitability decisions are distinct.
 * 4. Rejection decisions must provide an explicit reason.
 * 5. Batches not in PENDING_INSPECTION or HOLD cannot receive inspection submissions.
 */

describe('Inspection Safety Invariant Validation', () => {
  function validateInspectionSubmission(dto: {
    batchStatus: FoodBatchStatus;
    decision: InspectionDecision;
    isAiAssessed?: boolean;
    humanVerified?: boolean;
    targetSpecies?: AnimalSpecies[];
    rejectionReason?: string;
  }) {
    // Check batch eligibility
    if (![FoodBatchStatus.PENDING_INSPECTION, FoodBatchStatus.HOLD].includes(dto.batchStatus)) {
      throw new Error(`Batch in status ${dto.batchStatus} is ineligible for inspection.`);
    }

    // AI Safety rule
    if (dto.isAiAssessed === true && dto.humanVerified !== true) {
      if (
        dto.decision === InspectionDecision.APPROVED_HUMAN ||
        dto.decision === InspectionDecision.APPROVED_ANIMAL
      ) {
        throw new Error(
          'FOOD SAFETY VIOLATION: AI models are strictly prohibited from approving food for human or animal consumption.'
        );
      }
    }

    // Animal species rule
    if (dto.decision === InspectionDecision.APPROVED_ANIMAL) {
      if (!dto.targetSpecies || dto.targetSpecies.length === 0) {
        throw new Error(
          'FOOD SAFETY REQUIREMENT: Animal suitability decisions require explicit target species specification.'
        );
      }
    }

    // Rejection reason rule
    if (dto.decision === InspectionDecision.REJECTED) {
      if (!dto.rejectionReason || dto.rejectionReason.trim().length === 0) {
        throw new Error('Rejection decisions require an explicit rejection reason.');
      }
    }

    return true;
  }

  it('rejects AI assessment approving human consumption without human verification', () => {
    expect(() =>
      validateInspectionSubmission({
        batchStatus: FoodBatchStatus.PENDING_INSPECTION,
        decision: InspectionDecision.APPROVED_HUMAN,
        isAiAssessed: true,
        humanVerified: false,
      })
    ).toThrow('FOOD SAFETY VIOLATION: AI models are strictly prohibited');
  });

  it('rejects animal approval without target species specification', () => {
    expect(() =>
      validateInspectionSubmission({
        batchStatus: FoodBatchStatus.PENDING_INSPECTION,
        decision: InspectionDecision.APPROVED_ANIMAL,
        isAiAssessed: false,
        humanVerified: true,
        targetSpecies: [],
      })
    ).toThrow('Animal suitability decisions require explicit target species specification');
  });

  it('rejects rejection decision without rejection reason', () => {
    expect(() =>
      validateInspectionSubmission({
        batchStatus: FoodBatchStatus.HOLD,
        decision: InspectionDecision.REJECTED,
        isAiAssessed: false,
        humanVerified: true,
        rejectionReason: '',
      })
    ).toThrow('Rejection decisions require an explicit rejection reason');
  });

  it('rejects inspection attempt on already completed or expired batch', () => {
    expect(() =>
      validateInspectionSubmission({
        batchStatus: FoodBatchStatus.COMPLETED,
        decision: InspectionDecision.APPROVED_HUMAN,
        humanVerified: true,
      })
    ).toThrow('Batch in status completed is ineligible for inspection');

    expect(() =>
      validateInspectionSubmission({
        batchStatus: FoodBatchStatus.EXPIRED,
        decision: InspectionDecision.APPROVED_HUMAN,
        humanVerified: true,
      })
    ).toThrow('Batch in status expired is ineligible for inspection');
  });

  it('allows certified human inspection with complete valid parameters', () => {
    const valid = validateInspectionSubmission({
      batchStatus: FoodBatchStatus.PENDING_INSPECTION,
      decision: InspectionDecision.APPROVED_ANIMAL,
      isAiAssessed: false,
      humanVerified: true,
      targetSpecies: [AnimalSpecies.CANINE, AnimalSpecies.FELINE],
    });
    expect(valid).toBe(true);
  });
});
