import { DataReadinessService } from './data-readiness.service';
import { InMemoryDeliveryTaskRepository } from '../../delivery/repositories/in-memory-delivery-task.repository';
import { InMemoryOrganisationRepository } from '../../organisations/repositories/in-memory-organisation.repository';
import { InMemorySafeChainEventRepository } from '../../delivery/repositories/in-memory-safechain-event.repository';
import { ReadinessLevel } from '../enums/readiness-level.enum';

describe('DataReadinessService', () => {
  let service: DataReadinessService;
  let taskRepo: InMemoryDeliveryTaskRepository;
  let orgRepo: InMemoryOrganisationRepository;
  let eventRepo: InMemorySafeChainEventRepository;

  beforeEach(() => {
    taskRepo = new InMemoryDeliveryTaskRepository();
    orgRepo = new InMemoryOrganisationRepository();
    eventRepo = new InMemorySafeChainEventRepository();

    service = new DataReadinessService(taskRepo, orgRepo, eventRepo);
  });

  describe('generateQualityReport', () => {
    it('should generate an exhaustive data quality report across datasets and capabilities', async () => {
      // Seed some tasks
      await taskRepo.createTask({ allocatedQuantity: 50, quantityUnit: 'kg' });
      await taskRepo.createTask({ allocatedQuantity: 30, quantityUnit: 'kg' });

      const report = await service.generateQualityReport();

      expect(report.overallScore).toBeDefined();
      expect(report.overallGrade).toBeDefined();
      expect(report.datasets).toHaveLength(2);
      expect(report.capabilities).toHaveLength(6);
      expect(report.recommendations.length).toBeGreaterThan(0);

      // Verify each capability is assessed
      const capabilityNames = report.capabilities.map((c) => c.capabilityName);
      expect(capabilityNames).toContain('Feature 1: Waste Pattern Detective');
      expect(capabilityNames).toContain('Feature 2: Digital Twin Simulation');
      expect(capabilityNames).toContain('Feature 3: Emergency Resilience');
      expect(capabilityNames).toContain('Feature 4: Counterfactual Impact');
      expect(capabilityNames).toContain('Feature 5: Open Rescue Protocol (FORP)');
      expect(capabilityNames).toContain('Feature 6: Network Optimisation');
    });

    it('HONEST REPORTING: should flag Waste Pattern Detective as NOT_READY or PROTOTYPE_ONLY when observation count is low', async () => {
      // Only 2 tasks seeded
      await taskRepo.createTask({ allocatedQuantity: 50, quantityUnit: 'kg' });

      const report = await service.generateQualityReport();
      const wasteCap = report.capabilities.find((c) =>
        c.capabilityName.includes('Waste Pattern Detective'),
      );

      expect(wasteCap).toBeDefined();
      expect(wasteCap?.readinessLevel).not.toBe(ReadinessLevel.PRODUCTION_READY);
      expect(wasteCap?.blockers.length).toBeGreaterThan(0);
    });
  });
});
