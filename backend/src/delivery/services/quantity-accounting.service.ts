import { BadRequestException, Injectable } from '@nestjs/common';
import { DiscrepancyType } from '../enums/discrepancy.enum';

export interface QuantityReconciliation {
  allocatedQuantity: number;
  collectedQuantity: number;
  receivedQuantity: number;
  quantityUnit: string;
  isPartialDelivery: boolean;
  hasDiscrepancy: boolean;
  discrepancyQuantity: number;
  discrepancyType?: DiscrepancyType;
}

@Injectable()
export class QuantityAccountingService {
  /**
   * Reconciles allocated, collected, and received food quantities.
   * Ensures unit uniformity and non-negative values.
   * Never overwrites allocated quantities.
   */
  reconcileQuantities(params: {
    allocatedQuantity: number;
    collectedQuantity: number;
    receivedQuantity: number;
    allocatedUnit: string;
    collectedUnit: string;
    receivedUnit: string;
  }): QuantityReconciliation {
    const {
      allocatedQuantity,
      collectedQuantity,
      receivedQuantity,
      allocatedUnit,
      collectedUnit,
      receivedUnit,
    } = params;

    // Unit compatibility check: Never mix different measurement units (e.g. kg and portions)
    const normAllocatedUnit = allocatedUnit.trim().toLowerCase();
    const normCollectedUnit = collectedUnit.trim().toLowerCase();
    const normReceivedUnit = receivedUnit.trim().toLowerCase();

    if (
      normAllocatedUnit !== normCollectedUnit ||
      normAllocatedUnit !== normReceivedUnit
    ) {
      throw new BadRequestException(
        `Quantity unit mismatch: Allocation is in "${allocatedUnit}", pickup is in "${collectedUnit}", receipt is in "${receivedUnit}". Measurement units must be identical across lifecycle.`,
      );
    }

    // Negative quantity check
    if (allocatedQuantity < 0 || collectedQuantity < 0 || receivedQuantity < 0) {
      throw new BadRequestException('Quantities cannot be negative numbers.');
    }

    // Delivery calculation
    const isPartialDelivery = receivedQuantity < collectedQuantity;
    const isShortPickup = collectedQuantity < allocatedQuantity;
    const hasDiscrepancy = isPartialDelivery || isShortPickup || receivedQuantity > collectedQuantity;

    let discrepancyQuantity = 0;
    let discrepancyType: DiscrepancyType | undefined;

    if (isPartialDelivery) {
      discrepancyQuantity = Number((collectedQuantity - receivedQuantity).toFixed(3));
      discrepancyType = DiscrepancyType.MISSING_UNACCOUNTED;
    } else if (isShortPickup) {
      discrepancyQuantity = Number((allocatedQuantity - collectedQuantity).toFixed(3));
      discrepancyType = DiscrepancyType.SHORT_PICKUP;
    } else if (receivedQuantity > collectedQuantity) {
      discrepancyQuantity = Number((receivedQuantity - collectedQuantity).toFixed(3));
      discrepancyType = DiscrepancyType.EXCESS_PICKUP;
    }

    return {
      allocatedQuantity,
      collectedQuantity,
      receivedQuantity,
      quantityUnit: normAllocatedUnit,
      isPartialDelivery,
      hasDiscrepancy,
      discrepancyQuantity,
      discrepancyType,
    };
  }
}
