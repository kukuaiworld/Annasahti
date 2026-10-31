import { FoodSafetyTier, FoodSafetyInspection } from "../types";

export interface InspectionChecklist {
  visualCheck: boolean;
  smellCheck: boolean;
  packagingIntact: boolean;
  coreTemperature: number;
  preparationHoursAgo: number;
}

/**
 * Classifies food into appropriate safety tier based on FSSAI guidelines
 */
export function evaluateFoodSafetyTier(data: InspectionChecklist): {
  tier: FoodSafetyTier;
  reason: string;
} {
  // If spoiled or smelling sour
  if (!data.smellCheck || !data.visualCheck) {
    return {
      tier: "tier4_compost_biofuel",
      reason: "Visual or olfactive deterioration detected. Safe only for anaerobic industrial digestion.",
    };
  }

  // If cooked > 6 hours ago in ambient tropical temperature
  if (data.preparationHoursAgo > 6 && data.coreTemperature < 60 && data.coreTemperature > 5) {
    return {
      tier: "tier3_animal_feed",
      reason: "Exceeded safe human consumption temperature window (>6 hours). Wholesome for cattle & sanctuary animals.",
    };
  }

  // Safe for direct human dining
  if (data.coreTemperature >= 60 || data.coreTemperature <= 5) {
    return {
      tier: "tier1_human_immediate",
      reason: "Core temperature meets FSSAI hot-holding (>60°C) or cold-holding (<5°C) standards.",
    };
  }

  return {
    tier: "tier2_human_prep",
    reason: "Fresh produce/packaged food requiring kitchen washing/cooking before serving.",
  };
}
