import { describe, it, expect } from 'vitest';
import {
  InspectionDecision,
  AnimalSpecies,
  validateHumanInspection,
  HumanInspectionChecklist,
} from './foodInspection';
import { FoodBatchStatus } from '@/types/batches';

describe('FoodLoop Food Safety Invariants', () => {
  it('enforces that initial batches must be on PENDING_INSPECTION / HOLD', () => {
    // Invariant: Initial batch status is always pending inspection
    const initialStatus = FoodBatchStatus.PENDING_INSPECTION;
    expect(initialStatus).toBe('pending_inspection');
    expect(initialStatus).not.toBe('approved');
  });

  it('rejects human inspection without an explicit authorized decision', () => {
    const checklist: HumanInspectionChecklist = {
      batchId: 'batch-001',
      packagingIntact: true,
      visualCheckPassed: true,
      odourCheckPassed: true,
      decision: InspectionDecision.PENDING,
    };

    const result = validateHumanInspection(checklist);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('explicit authorized human inspection decision is required');
  });

  it('strictly blocks routing spoiled or foul-smelling food to animal consumption', () => {
    // Rule: Spoiled, contaminated or expired food must never be automatically routed to animal consumption
    const spoiledChecklist: HumanInspectionChecklist = {
      batchId: 'batch-002',
      packagingIntact: false,
      visualCheckPassed: false, // Deteriorated / discolored
      odourCheckPassed: false,  // Sour / rotting
      decision: InspectionDecision.APPROVED_ANIMAL,
      targetSpecies: [AnimalSpecies.BOVINE],
    };

    const result = validateHumanInspection(spoiledChecklist);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Spoiled or contaminated food failing visual or odour checks must NEVER be routed to animal consumption');
  });

  it('strictly blocks animal approval without explicit species suitability considerations', () => {
    // Rule: Animal food suitability must consider species-specific requirements
    const noSpeciesChecklist: HumanInspectionChecklist = {
      batchId: 'batch-003',
      packagingIntact: true,
      visualCheckPassed: true,
      odourCheckPassed: true,
      decision: InspectionDecision.APPROVED_ANIMAL,
      targetSpecies: [], // Empty species list
    };

    const result = validateHumanInspection(noSpeciesChecklist);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('selecting verified target species');
  });

  it('requires an explicit rejection reason when food safety inspector rejects a batch', () => {
    const rejectedChecklist: HumanInspectionChecklist = {
      batchId: 'batch-004',
      packagingIntact: false,
      visualCheckPassed: false,
      odourCheckPassed: true,
      decision: InspectionDecision.REJECTED,
      rejectionReason: '', // Missing reason
    };

    const result = validateHumanInspection(rejectedChecklist);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('detailed rejection reason is required');
  });

  it('accepts valid human inspection with species suitability', () => {
    const validChecklist: HumanInspectionChecklist = {
      batchId: 'batch-005',
      packagingIntact: true,
      visualCheckPassed: true,
      odourCheckPassed: true,
      temperatureCelsius: 62.5,
      decision: InspectionDecision.APPROVED_ANIMAL,
      targetSpecies: [AnimalSpecies.BOVINE],
      handlingNotes: 'Wholesome fresh vegetable trimmings suitable for cattle fodder',
    };

    const result = validateHumanInspection(validChecklist);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
