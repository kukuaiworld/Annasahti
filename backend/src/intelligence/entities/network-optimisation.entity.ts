export interface OptimisedMatchExplanation {
  batchId: string;
  donorId: string;
  recommendedRecipientId: string;
  allocatedQuantity: number;
  quantityUnit: string;
  estimatedTravelDistanceKm: number;
  priorityScore: number;
  selectionReasons: string[];
  safetyEligibilityConfirmed: boolean;
  speciesCompatibilityConfirmed: boolean;
}

export class NetworkOptimisationPlan {
  id: string;
  algorithm: string; // e.g. "bipartite_min_distance_flow_v1"
  generatedAt: Date;
  objectiveFunction: string;
  totalBatchesEvaluated: number;
  totalRecipientsEvaluated: number;
  recommendedMatches: OptimisedMatchExplanation[];
  metrics: {
    totalRedistributedKg: number;
    estimatedTotalDistanceKm: number;
    capacityUtilisationPercent: number;
  };
  humanReviewed: boolean;
  reviewedBy?: string;
}
