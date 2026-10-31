export interface RecurringSurplusWindow {
  dayOfWeek: string; // e.g. "Friday"
  timeSlot: string;  // e.g. "14:00-17:00"
  averageSurplusKg: number;
  frequencyScore: number; // 0.0 to 1.0
  sampleSize: number;
}

export class WastePatternAnalysis {
  donorOrganisationId?: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  totalDonationCyclesAnalyzed: number;
  totalSurplusKg: number;
  observedPatterns: {
    peakDays: string[];
    topCategories: { category: string; quantityKg: number; percentage: number }[];
    recurringWindows: RecurringSurplusWindow[];
    unclaimedRate: number;
    failedPickupRate: number;
  };
  forecastedSurplus?: {
    expectedNextWeekKg: number;
    confidenceIntervalLowerKg: number;
    confidenceIntervalUpperKg: number;
    confidenceLevel: number; // e.g. 0.95
    modelMethod: string;     // e.g. "descriptive_moving_average_v1"
  };
  recommendations: string[];
  isModelTrainedOnRealData: boolean;
  generatedAt: Date;
}
