import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InspectionsApi } from './inspections';
import { ApiClient } from './api-client';
import { AnimalSpecies, InspectionDecision } from '@/types/inspections';
import { FoodBatchStatus } from '@/types/batches';

describe('InspectionsApi', () => {
  let mockClient: ApiClient;
  let api: InspectionsApi;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
    api = new InspectionsApi(mockClient);
  });

  describe('getInspectionQueue', () => {
    it('calls GET /inspections/queue with pagination params', async () => {
      const mockResponse = {
        data: [
          {
            id: 'batch-1',
            batch_code: 'BATCH-001',
            food_name: 'Cooked Rice and Lentils',
            quantity: 25,
            quantity_unit: 'kg',
            status: FoodBatchStatus.PENDING_INSPECTION,
            created_at: '2026-10-31T00:00:00Z',
            donor_organisation_id: 'org-1',
            donor_name: 'Heritage Banquets',
            inspection_attempts: 0,
          },
        ],
        meta: { total: 1, page: 2, limit: 15, totalPages: 1 },
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.getInspectionQueue({ page: 2, limit: 15 });

      expect(mockClient.get).toHaveBeenCalledWith('/inspections/queue', {
        params: { page: 2, limit: 15 },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].food_name).toBe('Cooked Rice and Lentils');
    });
  });

  describe('getBatchInspectionDetail', () => {
    it('calls GET /inspections/batch/:batchId and returns batch with previous inspections', async () => {
      const mockResponse = {
        batch: {
          id: 'batch-123',
          batch_code: 'FL-BATCH-123',
          donor_organisation_id: 'donor-1',
          donor_name: 'Central Kitchen',
          food_name: 'Vegetable Pulao',
          quantity: 40,
          quantity_unit: 'portions',
          status: FoodBatchStatus.HOLD,
          created_at: '2026-10-31T01:00:00Z',
          updated_at: '2026-10-31T01:30:00Z',
        },
        inspections: [
          {
            id: 'insp-1',
            batch_id: 'batch-123',
            inspector_id: 'insp-user-1',
            inspector_name: 'Inspector Sharma',
            decision: InspectionDecision.REQUIRES_REVIEW,
            temperature_c: 62.5,
            is_ai_assessed: false,
            human_verified: true,
            evidence_urls: [],
            safety_checklist: {},
            created_at: '2026-10-31T01:30:00Z',
          },
        ],
      };

      vi.mocked(mockClient.get).mockResolvedValue(mockResponse);

      const result = await api.getBatchInspectionDetail('batch-123');

      expect(mockClient.get).toHaveBeenCalledWith('/inspections/batch/batch-123');
      expect(result.batch.batch_code).toBe('FL-BATCH-123');
      expect(result.inspections).toHaveLength(1);
      expect(result.inspections[0].decision).toBe(InspectionDecision.REQUIRES_REVIEW);
    });
  });

  describe('recordInspection', () => {
    it('submits human verification payload via POST /inspections', async () => {
      const dto = {
        batchId: 'batch-123',
        decision: InspectionDecision.APPROVED_HUMAN,
        isAiAssessed: false,
        humanVerified: true,
        temperatureC: 4.0,
        packagingCondition: 'Sealed food-grade containers',
        appearanceCondition: 'Fresh',
        odourCondition: 'Pleasant aroma',
        inspectionNotes: 'Passed all sensory and cold chain criteria',
      };

      const mockRecord = {
        id: 'insp-999',
        batch_id: 'batch-123',
        inspector_id: 'user-inspector',
        decision: InspectionDecision.APPROVED_HUMAN,
        temperature_c: 4.0,
        is_ai_assessed: false,
        human_verified: true,
        evidence_urls: [],
        safety_checklist: {},
        created_at: '2026-10-31T02:00:00Z',
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockRecord);

      const result = await api.recordInspection(dto);

      expect(mockClient.post).toHaveBeenCalledWith('/inspections', dto);
      expect(result.id).toBe('insp-999');
      expect(result.decision).toBe(InspectionDecision.APPROVED_HUMAN);
    });

    it('submits species-specific animal approval payload', async () => {
      const dto = {
        batchId: 'batch-456',
        decision: InspectionDecision.APPROVED_ANIMAL,
        isAiAssessed: false,
        humanVerified: true,
        targetSpecies: [AnimalSpecies.CANINE, AnimalSpecies.FELINE],
        temperatureC: 15.0,
        packagingCondition: 'Clean trays',
        inspectionNotes: 'Suitable for animal rescue shelters',
      };

      const mockRecord = {
        id: 'insp-888',
        batch_id: 'batch-456',
        inspector_id: 'user-inspector',
        decision: InspectionDecision.APPROVED_ANIMAL,
        target_species: [AnimalSpecies.CANINE, AnimalSpecies.FELINE],
        is_ai_assessed: false,
        human_verified: true,
        evidence_urls: [],
        safety_checklist: {},
        created_at: '2026-10-31T02:00:00Z',
      };

      vi.mocked(mockClient.post).mockResolvedValue(mockRecord);

      const result = await api.recordInspection(dto);

      expect(mockClient.post).toHaveBeenCalledWith('/inspections', dto);
      expect(result.decision).toBe(InspectionDecision.APPROVED_ANIMAL);
      expect(result.target_species).toContain(AnimalSpecies.CANINE);
    });
  });
});
