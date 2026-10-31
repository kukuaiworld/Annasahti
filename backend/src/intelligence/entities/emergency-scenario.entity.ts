import { EmergencyType } from '../enums/simulation-scenario.enum';

export interface EmergencyRerouteRecommendation {
  batchId: string;
  originalRecipientId: string;
  recommendedAlternativeRecipientId: string;
  foodCategory: string;
  quantity: number;
  quantityUnit: string;
  deadline: Date;
  verifiedEligibilityReason: string;
  riskAssessment: string;
  isHumanApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  overrideNotes?: string;
}

export class EmergencyDisruptionScenario {
  id: string;
  emergencyType: EmergencyType;
  reportedAt: Date;
  affectedGeographicZone?: string;
  affectedDonorsCount: number;
  affectedRecipientsCount: number;
  atRiskBatchesCount: number;
  recommendations: EmergencyRerouteRecommendation[];
  requiresHumanReview: true;
  reviewedBy?: string;
  reviewedAt?: Date;
  status: 'pending_review' | 'partially_approved' | 'approved' | 'overridden';
}
