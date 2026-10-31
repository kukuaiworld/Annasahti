import { DigitalTwinSimulationResult } from '../entities/simulation-result.entity';
import { EmergencyDisruptionScenario } from '../entities/emergency-scenario.entity';
import { CounterfactualImpactAnalysis } from '../entities/counterfactual-impact.entity';
import { NetworkOptimisationPlan } from '../entities/network-optimisation.entity';

export interface IIntelligenceRepository {
  saveSimulation(sim: DigitalTwinSimulationResult): Promise<DigitalTwinSimulationResult>;
  findSimulationById(id: string): Promise<DigitalTwinSimulationResult | null>;

  saveEmergencyScenario(scenario: EmergencyDisruptionScenario): Promise<EmergencyDisruptionScenario>;
  findEmergencyScenarioById(id: string): Promise<EmergencyDisruptionScenario | null>;

  saveCounterfactual(cf: CounterfactualImpactAnalysis): Promise<CounterfactualImpactAnalysis>;
  findCounterfactualById(id: string): Promise<CounterfactualImpactAnalysis | null>;

  saveOptimisationPlan(plan: NetworkOptimisationPlan): Promise<NetworkOptimisationPlan>;
  findOptimisationPlanById(id: string): Promise<NetworkOptimisationPlan | null>;
}

export const INTELLIGENCE_REPOSITORY = Symbol('IIntelligenceRepository');
