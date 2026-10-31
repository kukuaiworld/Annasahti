import { BadRequestException } from '@nestjs/common';
import { QuantityAccountingService } from './quantity-accounting.service';
import { DiscrepancyType } from '../enums/discrepancy.enum';

describe('QuantityAccountingService', () => {
  let service: QuantityAccountingService;

  beforeEach(() => {
    service = new QuantityAccountingService();
  });

  describe('reconcileQuantities', () => {
    it('should successfully reconcile identical quantities without discrepancies', () => {
      const result = service.reconcileQuantities({
        allocatedQuantity: 50,
        collectedQuantity: 50,
        receivedQuantity: 50,
        allocatedUnit: 'kg',
        collectedUnit: 'kg',
        receivedUnit: 'kg',
      });

      expect(result.isPartialDelivery).toBe(false);
      expect(result.hasDiscrepancy).toBe(false);
      expect(result.discrepancyQuantity).toBe(0);
      expect(result.quantityUnit).toBe('kg');
    });

    it('FOOD SAFETY & LEDGER: should reject mixed units (e.g. kg and portions)', () => {
      expect(() =>
        service.reconcileQuantities({
          allocatedQuantity: 50,
          collectedQuantity: 50,
          receivedQuantity: 50,
          allocatedUnit: 'kg',
          collectedUnit: 'portions', // Mixed!
          receivedUnit: 'kg',
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.reconcileQuantities({
          allocatedQuantity: 100,
          collectedQuantity: 100,
          receivedQuantity: 80,
          allocatedUnit: 'portions',
          collectedUnit: 'portions',
          receivedUnit: 'kg', // Mixed!
        }),
      ).toThrow(BadRequestException);
    });

    it('should reject negative quantities', () => {
      expect(() =>
        service.reconcileQuantities({
          allocatedQuantity: 50,
          collectedQuantity: -5,
          receivedQuantity: 50,
          allocatedUnit: 'kg',
          collectedUnit: 'kg',
          receivedUnit: 'kg',
        }),
      ).toThrow(BadRequestException);
    });

    it('CRITICAL LEDGER: should accurately detect partial delivery and compute missing quantity independently', () => {
      // Worked numerical example: Allocated 50 kg, Picked up 50 kg, Received 42 kg -> 8 kg discrepancy
      const result = service.reconcileQuantities({
        allocatedQuantity: 50,
        collectedQuantity: 50,
        receivedQuantity: 42,
        allocatedUnit: 'kg',
        collectedUnit: 'kg',
        receivedUnit: 'kg',
      });

      expect(result.isPartialDelivery).toBe(true);
      expect(result.hasDiscrepancy).toBe(true);
      expect(result.discrepancyQuantity).toBe(8);
      expect(result.discrepancyType).toBe(DiscrepancyType.MISSING_UNACCOUNTED);
      // All quantities preserved independently
      expect(result.allocatedQuantity).toBe(50);
      expect(result.collectedQuantity).toBe(50);
      expect(result.receivedQuantity).toBe(42);
    });

    it('should detect short pickup discrepancy', () => {
      // Allocated 50 kg, Picked up 40 kg, Received 40 kg -> 10 kg short pickup
      const result = service.reconcileQuantities({
        allocatedQuantity: 50,
        collectedQuantity: 40,
        receivedQuantity: 40,
        allocatedUnit: 'kg',
        collectedUnit: 'kg',
        receivedUnit: 'kg',
      });

      expect(result.isPartialDelivery).toBe(false);
      expect(result.hasDiscrepancy).toBe(true);
      expect(result.discrepancyQuantity).toBe(10);
      expect(result.discrepancyType).toBe(DiscrepancyType.SHORT_PICKUP);
    });
  });
});
