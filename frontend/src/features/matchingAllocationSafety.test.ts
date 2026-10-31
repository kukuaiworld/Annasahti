import { describe, it, expect } from 'vitest';
import { FoodBatchStatus, FoodCategory } from '@/types/batches';

/**
 * Matching and Allocation Safety Invariants Rulebook:
 * 1. Only batches with status APPROVED or PARTIALLY_ALLOCATED can enter matching.
 * 2. Batches with status PENDING_INSPECTION, HOLD, REJECTED, CANCELLED, or EXPIRED must be rejected.
 * 3. Batches with 0 available quantity cannot be matched or allocated.
 * 4. Allocation quantity must be positive (> 0) and not exceed available quantity.
 * 5. Allocation quantity unit must strictly match the batch's unit.
 * 6. Ineligible recipients cannot receive allocations.
 * 7. Two-party cancellation or decline actions require explicit reasons.
 */

describe('Matching & Allocation Safety Invariants', () => {
  function validateBatchForMatching(batch: {
    status: FoodBatchStatus;
    category?: FoodCategory | null;
    availableQuantity: number;
  }) {
    if (![FoodBatchStatus.APPROVED, FoodBatchStatus.PARTIALLY_ALLOCATED].includes(batch.status)) {
      throw new Error(`SAFETY FILTER: Batch in status "${batch.status}" cannot enter matching.`);
    }

    if (!batch.category) {
      throw new Error('SAFETY FILTER: Uninspected batch has no destination category.');
    }

    if (batch.availableQuantity <= 0) {
      throw new Error('QUANTITY FILTER: Batch has 0 remaining available quantity.');
    }

    return true;
  }

  function validateAllocationSubmission(dto: {
    batchUnit: string;
    requestUnit: string;
    availableQuantity: number;
    allocatedQuantity: number;
    isRecipientEligible: boolean;
  }) {
    if (!dto.isRecipientEligible) {
      throw new Error('ELIGIBILITY VIOLATION: Cannot allocate to an ineligible recipient.');
    }

    if (dto.allocatedQuantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    if (dto.allocatedQuantity > dto.availableQuantity) {
      throw new Error('DOUBLE-ALLOCATION PREVENTED: Quantity exceeds available batch balance.');
    }

    if (dto.requestUnit !== dto.batchUnit) {
      throw new Error(`Incompatible unit: Expected ${dto.batchUnit}, received ${dto.requestUnit}.`);
    }

    return true;
  }

  it('rejects unapproved batches from entering matching', () => {
    expect(() =>
      validateBatchForMatching({
        status: FoodBatchStatus.PENDING_INSPECTION,
        category: null,
        availableQuantity: 50,
      })
    ).toThrow('cannot enter matching');

    expect(() =>
      validateBatchForMatching({
        status: FoodBatchStatus.HOLD,
        category: FoodCategory.HUMAN_CONSUMPTION,
        availableQuantity: 50,
      })
    ).toThrow('cannot enter matching');

    expect(() =>
      validateBatchForMatching({
        status: FoodBatchStatus.REJECTED,
        category: null,
        availableQuantity: 50,
      })
    ).toThrow('cannot enter matching');
  });

  it('rejects batches with 0 available balance', () => {
    expect(() =>
      validateBatchForMatching({
        status: FoodBatchStatus.APPROVED,
        category: FoodCategory.HUMAN_CONSUMPTION,
        availableQuantity: 0,
      })
    ).toThrow('0 remaining available quantity');
  });

  it('allows approved batch with positive balance to match', () => {
    const valid = validateBatchForMatching({
      status: FoodBatchStatus.APPROVED,
      category: FoodCategory.HUMAN_CONSUMPTION,
      availableQuantity: 40,
    });
    expect(valid).toBe(true);
  });

  it('rejects allocation exceeding available batch quantity', () => {
    expect(() =>
      validateAllocationSubmission({
        batchUnit: 'portions',
        requestUnit: 'portions',
        availableQuantity: 30,
        allocatedQuantity: 35,
        isRecipientEligible: true,
      })
    ).toThrow('Quantity exceeds available batch balance');
  });

  it('rejects allocation when units mismatch', () => {
    expect(() =>
      validateAllocationSubmission({
        batchUnit: 'portions',
        requestUnit: 'kg',
        availableQuantity: 50,
        allocatedQuantity: 20,
        isRecipientEligible: true,
      })
    ).toThrow('Incompatible unit');
  });

  it('rejects allocation to an ineligible recipient', () => {
    expect(() =>
      validateAllocationSubmission({
        batchUnit: 'kg',
        requestUnit: 'kg',
        availableQuantity: 50,
        allocatedQuantity: 20,
        isRecipientEligible: false,
      })
    ).toThrow('ELIGIBILITY VIOLATION');
  });

  it('accepts valid allocation with exact unit and within available balance', () => {
    const result = validateAllocationSubmission({
      batchUnit: 'portions',
      requestUnit: 'portions',
      availableQuantity: 50,
      allocatedQuantity: 25,
      isRecipientEligible: true,
    });
    expect(result).toBe(true);
  });
});
