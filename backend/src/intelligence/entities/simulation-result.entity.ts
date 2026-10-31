import { SimulationScenarioType } from '../enums/simulation-scenario.enum';

export class DigitalTwinSimulationResult {
  id: string;
  isSimulatedOutput: true; // Strict guard: never mix with real operational impact
  scenarioName: string;
  scenarioType: SimulationScenarioType;
  modelVersion: string;
  executedAt: Date;
  inputsAndAssumptions: Record<string, unknown>;
  projectedMetrics: {
    estimatedSuccessfulDeliveries: number;
    estimatedUnclaimedSurplusKg: number;
    projectedCapacityUtilisationPercent: number;
    averageDeliveryDelayMinutes: number;
    totalTransportDistanceKm: number;
    bottlenecksIdentified: string[];
  };
  scenarioComparison?: {
    baselineDeliveredKg: number;
    scenarioDeliveredKg: number;
    differencePercentage: number;
  };
  disclaimer: string;
}
