import { SimulationOrchestratorService } from './simulation-orchestrator.service';
import { InMemoryIntelligenceRepository } from '../repositories/in-memory-intelligence.repository';
import { InMemoryDeliveryTaskRepository } from '../../delivery/repositories/in-memory-delivery-task.repository';
import { SimulationScenarioType, EmergencyType } from '../enums/simulation-scenario.enum';

describe('SimulationOrchestratorService', () => {
  let service: SimulationOrchestratorService;
  let repo: InMemoryIntelligenceRepository;
  let taskRepo: InMemoryDeliveryTaskRepository;

  beforeEach(() => {
    repo = new InMemoryIntelligenceRepository();
    taskRepo = new InMemoryDeliveryTaskRepository();
    service = new SimulationOrchestratorService(repo, taskRepo);
  });

  describe('runDigitalTwinSimulation', () => {
    it('STRICT ISOLATION: should execute simulation and clearly label output as simulated', async () => {
      await taskRepo.createTask({ allocatedQuantity: 100, quantityUnit: 'kg' });

      const sim = await service.runDigitalTwinSimulation({
        scenarioType: SimulationScenarioType.SURGE_DONATIONS,
        surplusVolumeChangePercent: 50,
        volunteerAvailabilityChangePercent: -20,
        notes: 'Monsoon simulation',
      });

      expect(sim.id).toBeDefined();
      expect(sim.isSimulatedOutput).toBe(true);
      expect(sim.disclaimer).toContain('NEVER be reported as real operational impact');
      expect(sim.projectedMetrics.bottlenecksIdentified.length).toBeGreaterThan(0);
    });
  });

  describe('createEmergencyScenario', () => {
    it('HUMAN OVERSIGHT: should generate reroute recommendations requiring human review', async () => {
      await taskRepo.createTask({ allocatedQuantity: 50, quantityUnit: 'kg' });

      const scenario = await service.createEmergencyScenario({
        emergencyType: EmergencyType.FLOODING,
        affectedZone: 'District 5',
        description: 'Road submerged under water',
      });

      expect(scenario.id).toBeDefined();
      expect(scenario.requiresHumanReview).toBe(true);
      expect(scenario.status).toBe('pending_review');
      expect(scenario.recommendations.length).toBeGreaterThan(0);
      expect(scenario.recommendations[0].isHumanApproved).toBe(false);
    });
  });

  describe('runCounterfactualAnalysis', () => {
    it('TRANSPARENCY: should distinguish actual deliveries from additionality and avoided disposal', async () => {
      await taskRepo.createTask({ allocatedQuantity: 100, quantityUnit: 'kg' });

      const cf = await service.runCounterfactualAnalysis({
        baselineDiscardRate: 0.65,
      });

      expect(cf.actualConfirmedDeliveriesKg).toBe(100);
      expect(cf.counterfactualEstimates.estimatedDiscardAvoidedKg).toBe(65);
      expect(cf.counterfactualEstimates.alternateChannelRedirectionRate).toBe(0.35);
      expect(cf.uncertaintyAndSensitivity.confidenceLevel).toBe(0.9);
      expect(cf.attributionStatement).toContain('avoiding 100% gross attribution');
    });
  });

  describe('runNetworkOptimisation', () => {
    it('EXPLAINABILITY: should generate bipartite matching and explain selection reasons', async () => {
      await taskRepo.createTask({ allocatedQuantity: 75, quantityUnit: 'kg' });

      const plan = await service.runNetworkOptimisation({
        maxDistanceKm: 20,
      });

      expect(plan.id).toBeDefined();
      expect(plan.recommendedMatches.length).toBeGreaterThan(0);
      expect(plan.recommendedMatches[0].selectionReasons.length).toBeGreaterThan(0);
      expect(plan.recommendedMatches[0].safetyEligibilityConfirmed).toBe(true);
    });
  });
});
