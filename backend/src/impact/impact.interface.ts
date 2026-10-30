export interface MetricDefinition {
  metricKey: string;
  displayName: string;
  unit: string;
  description: string;
  sourceRecord: string;
  qualifyingStatus: string;
  aggregationMethod: string;
  isEstimate: boolean;
  status: 'active' | 'unavailable' | 'deprecated';
  methodologyCode?: string;
  methodologyVersion?: string;
}

export interface ImpactOverview {
  reportingPeriod: {
    startDate: string | null;
    endDate: string | null;
    timezone: string;
  };
  filter: {
    organisationId?: string;
    organisationName?: string;
    isPlatformWide: boolean;
  };
  metrics: {
    mealsRescued: {
      value: number | null;
      unit: string;
      status: 'calculated' | 'unavailable';
      methodologyCode: string;
      methodologyVersion: string;
      factorUsed: string;
      note: string;
    };
    humanFoodDeliveredKg: {
      value: number;
      unit: string;
      eligibleOrganisationsKg: number;
      ngoSpecificKg: number;
      otherHumanitarianKg: number;
    };
    animalAppropriateFoodKg: {
      value: number;
      unit: string;
      deliveriesCount: number;
    };
    organicWasteProcessedKg: {
      value: number;
      unit: string;
      recordsCount: number;
    };
    successfulDeliveriesCount: {
      value: number;
      unit: string;
    };
    co2eAvoidedKg: {
      value: number | null;
      unit: string;
      isEstimate: true;
      methodologyCode: string;
      methodologyVersion: string;
      breakdown: {
        humanFoodDiversionKgCo2e: number;
        animalFeedDiversionKgCo2e: number;
        organicWasteCompostingKgCo2e: number;
      };
      disclaimer: string;
    };
  };
  dataQuality: {
    unreconciledLossKg: number;
    damagedQuantityKg: number;
    missingQuantityKg: number;
    dataFreshnessTimestamp: string;
  };
}

export interface TrendPoint {
  periodKey: string; // e.g., '2026-01' or '2026'
  periodStart: string;
  periodEnd: string;
  mealsRescued: number;
  humanFoodDeliveredKg: number;
  animalFoodRecoveredKg: number;
  organicWasteProcessedKg: number;
  successfulDeliveriesCount: number;
  estimatedCo2eAvoidedKg: number;
}

export interface CategoryBreakdown {
  reportingPeriod: {
    startDate: string | null;
    endDate: string | null;
  };
  categories: {
    humanConsumption: {
      category: 'human_consumption';
      label: 'Human Food Rescue';
      totalKg: number;
      percentage: number;
      deliveryCount: number;
      mealsEquivalent: number;
    };
    animalAppropriate: {
      category: 'animal_appropriate';
      label: 'Animal Feed Recovery';
      totalKg: number;
      percentage: number;
      deliveryCount: number;
    };
    organicWaste: {
      category: 'organic_waste';
      label: 'Organic Waste Processing';
      totalKg: number;
      percentage: number;
      processingRecordsCount: number;
    };
  };
  totalDiversionKg: number;
  duplicatePreventionNotice: string;
}

export interface MethodologyDetail {
  methodologyCode: string;
  version: string;
  description: string;
  sourceReference: string;
  assumptions: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}
