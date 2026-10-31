import { Injectable } from '@nestjs/common';
import { IIntelligenceRepository } from './intelligence.repository.interface';
import { DigitalTwinSimulationResult } from '../entities/simulation-result.entity';
import { EmergencyDisruptionScenario } from '../entities/emergency-scenario.entity';
import { CounterfactualImpactAnalysis } from '../entities/counterfactual-impact.entity';
import { NetworkOptimisationPlan } from '../entities/network-optimisation.entity';

@Injectable()
export class InMemoryIntelligenceRepository implements IIntelligenceRepository {
  private readonly simulations = new Map<string, DigitalTwinSimulationResult>();
  private readonly emergencies = new Map<string, EmergencyDisruptionScenario>();
  private readonly counterfactuals = new Map<string, CounterfactualImpactAnalysis>();
  private readonly optimisations = new Map<string, NetworkOptimisationPlan>();

  async saveSimulation(sim: DigitalTwinSimulationResult): Promise<DigitalTwinSimulationResult> {
    this.simulations.set(sim.id, { ...sim });
    return { ...sim };
  }

  async findSimulationById(id: string): Promise<DigitalTwinSimulationResult | null> {
    const s = this.simulations.get(id);
    return s ? { ...s } : null;
  }

  async saveEmergencyScenario(
    scenario: EmergencyDisruptionScenario,
  ): Promise<EmergencyDisruptionScenario> {
    this.emergencies.set(scenario.id, { ...scenario });
    return { ...scenario };
  }

  async findEmergencyScenarioById(id: string): Promise<EmergencyDisruptionScenario | null> {
    const e = this.emergencies.get(id);
    return e ? { ...e } : null;
  }

  async saveCounterfactual(
    cf: CounterfactualImpactAnalysis,
  ): Promise<CounterfactualImpactAnalysis> {
    this.counterfactuals.set(cf.id, { ...cf });
    return { ...cf };
  }

  async findCounterfactualById(id: string): Promise<CounterfactualImpactAnalysis | null> {
    const c = this.counterfactuals.get(id);
    return c ? { ...c } : null;
  }

  async saveOptimisationPlan(
    plan: NetworkOptimisationPlan,
  ): Promise<NetworkOptimisationPlan> {
    this.optimisations.set(plan.id, { ...plan });
    return { ...plan };
  }

  async findOptimisationPlanById(id: string): Promise<NetworkOptimisationPlan | null> {
    const o = this.optimisations.get(id);
    return o ? { ...o } : null;
  }

  clear(): void {
    this.simulations.clear();
    this.emergencies.clear();
    this.counterfactuals.clear();
    this.optimisations.clear();
  }
}
