import { WastePatternService } from './waste-pattern.service';
import { InMemoryDeliveryTaskRepository } from '../../delivery/repositories/in-memory-delivery-task.repository';

describe('WastePatternService', () => {
  let service: WastePatternService;
  let taskRepo: InMemoryDeliveryTaskRepository;

  beforeEach(() => {
    taskRepo = new InMemoryDeliveryTaskRepository();
    service = new WastePatternService(taskRepo);
  });

  describe('analyzeWastePatterns', () => {
    it('should compute descriptive surplus metrics and peak days', async () => {
      await taskRepo.createTask({
        allocatedQuantity: 60,
        quantityUnit: 'kg',
        foodCategory: 'cooked_meals',
      });
      await taskRepo.createTask({
        allocatedQuantity: 40,
        quantityUnit: 'kg',
        foodCategory: 'fresh_produce',
      });

      const analysis = await service.analyzeWastePatterns();

      expect(analysis.totalDonationCyclesAnalyzed).toBe(2);
      expect(analysis.totalSurplusKg).toBe(100);
      expect(analysis.observedPatterns.topCategories.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('UNCERTAINTY & HONESTY: should mark model as not trained on real data if observations < 10', async () => {
      await taskRepo.createTask({ allocatedQuantity: 50, quantityUnit: 'kg' });

      const analysis = await service.analyzeWastePatterns();
      expect(analysis.isModelTrainedOnRealData).toBe(false);
      expect(analysis.forecastedSurplus?.modelMethod).toBe('descriptive_baseline_provisional');
      expect(analysis.forecastedSurplus?.confidenceLevel).toBe(0.95);
    });
  });
});
