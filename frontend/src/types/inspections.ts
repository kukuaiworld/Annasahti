import { AnimalSpecies, FoodBatchStatus, FoodCategory } from './batches';

export enum InspectionDecision {
  PENDING = 'pending',
  APPROVED_HUMAN = 'approved_human',
  APPROVED_ANIMAL = 'approved_animal',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review',
  APPROVED_ORGANIC_WASTE = 'approved_organic_waste',
}

export { AnimalSpecies };

export interface InspectionQueueItem {
  id: string;
  batch_code: string;
  food_name: string;
  quantity: number;
  quantity_unit: string;
  status: FoodBatchStatus;
  best_before_at?: string;
  pickup_deadline?: string;
  created_at: string;
  donor_organisation_id: string;
  donor_name: string;
  donor_address?: string;
  inspection_attempts: number;
}

export interface InspectionQueueResponse {
  data: InspectionQueueItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InspectionRecord {
  id: string;
  batch_id: string;
  inspector_id: string;
  inspector_name?: string;
  decision: InspectionDecision;
  inspected_at?: string;
  temperature_c?: number | null;
  packaging_condition?: string | null;
  appearance_condition?: string | null;
  odour_condition?: string | null;
  handling_notes?: string | null;
  rejection_reason?: string | null;
  evidence_urls: string[];
  created_at: string;
  is_ai_assessed: boolean;
  human_verified: boolean;
  target_species?: AnimalSpecies[] | null;
  safety_checklist: Record<string, any>;
  inspection_notes?: string | null;
}

export interface BatchInspectionDetailResponse {
  batch: {
    id: string;
    batch_code: string;
    donor_organisation_id: string;
    donor_name: string;
    donor_address?: string;
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
    created_at: string;
    updated_at: string;
  };
  inspections: InspectionRecord[];
}

export interface CreateInspectionDto {
  batchId: string;
  decision: InspectionDecision;
  isAiAssessed?: boolean;
  humanVerified?: boolean;
  targetSpecies?: AnimalSpecies[];
  temperatureC?: number;
  packagingCondition?: string;
  appearanceCondition?: string;
  odourCondition?: string;
  handlingNotes?: string;
  rejectionReason?: string;
  evidenceUrls?: string[];
  safetyChecklist?: Record<string, any>;
  inspectionNotes?: string;
}

export interface InspectionQueryDto {
  page?: number;
  limit?: number;
}
