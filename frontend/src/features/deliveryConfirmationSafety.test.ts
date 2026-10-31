import { describe, it, expect } from 'vitest';

/**
 * Recipient Delivery Confirmation Safety & Reconciliation Rules:
 * 1. Independent Recipient Responsibility: Confirmed by recipient, not unilaterally by courier.
 * 2. Exact Quantity Reconciliation: receivedQuantity + damagedQuantity + missingQuantity == allocatedQuantity.
 * 3. Unit Matching: confirmation quantityUnit must match delivery task quantityUnit.
 * 4. Discrepancy Reason: Required if damagedQuantity > 0 or missingQuantity > 0.
 * 5. Negative quantities are strictly rejected.
 */

describe('Recipient Delivery Confirmation Safety & Reconciliation', () => {
  function validateRecipientConfirmation(params: {
    allocatedQuantity: number;
    taskUnit: string;
    dto: {
      receivedQuantity: number;
      damagedQuantity?: number;
      missingQuantity?: number;
      quantityUnit: string;
      discrepancyReason?: string;
    };
  }) {
    const received = params.dto.receivedQuantity;
    const damaged = params.dto.damagedQuantity ?? 0;
    const missing = params.dto.missingQuantity ?? 0;

    if (received < 0 || damaged < 0 || missing < 0) {
      throw new Error('Quantities cannot be negative.');
    }

    if (params.dto.quantityUnit !== params.taskUnit) {
      throw new Error(
        `Quantity unit mismatch: Confirmation provided in "${params.dto.quantityUnit}", but delivery requires "${params.taskUnit}".`
      );
    }

    const total = received + damaged + missing;
    if (Math.abs(total - params.allocatedQuantity) > 0.001) {
      throw new Error(
        `ACCOUNTING RECONCILIATION FAILED: Sum of received (${received}), damaged (${damaged}), and missing (${missing}) must equal allocated quantity (${params.allocatedQuantity} ${params.taskUnit}).`
      );
    }

    if ((damaged > 0 || missing > 0) && (!params.dto.discrepancyReason || !params.dto.discrepancyReason.trim())) {
      throw new Error('A discrepancy reason is required when damaged or missing quantities are reported.');
    }

    return true;
  }

  it('rejects confirmation when sum does not match allocated quantity', () => {
    expect(() =>
      validateRecipientConfirmation({
        allocatedQuantity: 50,
        taskUnit: 'portions',
        dto: {
          receivedQuantity: 40,
          damagedQuantity: 5,
          missingQuantity: 0, // sum is 45, expected 50
          quantityUnit: 'portions',
        },
      })
    ).toThrow('ACCOUNTING RECONCILIATION FAILED');
  });

  it('rejects confirmation when quantity unit mismatches', () => {
    expect(() =>
      validateRecipientConfirmation({
        allocatedQuantity: 50,
        taskUnit: 'portions',
        dto: {
          receivedQuantity: 50,
          damagedQuantity: 0,
          missingQuantity: 0,
          quantityUnit: 'kg', // expected portions
        },
      })
    ).toThrow('Quantity unit mismatch');
  });

  it('rejects discrepancy without explanation', () => {
    expect(() =>
      validateRecipientConfirmation({
        allocatedQuantity: 50,
        taskUnit: 'portions',
        dto: {
          receivedQuantity: 45,
          damagedQuantity: 5,
          missingQuantity: 0,
          quantityUnit: 'portions',
          discrepancyReason: '', // missing explanation
        },
      })
    ).toThrow('A discrepancy reason is required');
  });

  it('rejects negative quantity entries', () => {
    expect(() =>
      validateRecipientConfirmation({
        allocatedQuantity: 50,
        taskUnit: 'portions',
        dto: {
          receivedQuantity: 55,
          damagedQuantity: -5,
          missingQuantity: 0,
          quantityUnit: 'portions',
        },
      })
    ).toThrow('Quantities cannot be negative');
  });

  it('accepts perfectly reconciled delivery without discrepancy', () => {
    const result = validateRecipientConfirmation({
      allocatedQuantity: 40,
      taskUnit: 'portions',
      dto: {
        receivedQuantity: 40,
        damagedQuantity: 0,
        missingQuantity: 0,
        quantityUnit: 'portions',
      },
    });
    expect(result).toBe(true);
  });

  it('accepts reconciled delivery with explained discrepancy', () => {
    const result = validateRecipientConfirmation({
      allocatedQuantity: 100,
      taskUnit: 'kg',
      dto: {
        receivedQuantity: 92,
        damagedQuantity: 5,
        missingQuantity: 3,
        quantityUnit: 'kg',
        discrepancyReason: '5kg damaged by box collapse; 3kg unaccounted for at loading',
      },
    });
    expect(result).toBe(true);
  });
});
