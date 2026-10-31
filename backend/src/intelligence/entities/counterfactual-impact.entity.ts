export class CounterfactualImpactAnalysis {
  id: string;
  methodologyVersion: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  actualConfirmedDeliveriesKg: number;

  counterfactualEstimates: {
    baselineUnclaimedDiscardRate: number; // e.g. 0.65 (65% would likely have been discarded without intervention)
    alternateChannelRedirectionRate: number; // e.g. 0.35 (35% would have reached other channels)
    estimatedDiscardAvoidedKg: number;
    estimatedAdditionalImpactKg: number; // Net additionality
    co2eAvoidedKgEstimated: number;
    emissionFactorUsedKgCo2PerKgFood: number; // Documented conversion factor with citation
  };

  uncertaintyAndSensitivity: {
    confidenceLevel: number; // e.g. 0.90
    lowerBoundKg: number;
    upperBoundKg: number;
    keyAssumptions: string[];
    sensitivityNotes: string;
  };

  attributionStatement: string;
  calculatedAt: Date;
}
