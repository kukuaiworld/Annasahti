import { ForpService } from './forp.service';
import { ForpRecordType, ForpVersion } from '../enums/forp-version.enum';

describe('ForpService', () => {
  let service: ForpService;

  beforeEach(() => {
    service = new ForpService();
  });

  describe('getProtocolSpecification', () => {
    it('should return versioned FORP specification with standard schemas', () => {
      const spec = service.getProtocolSpecification(ForpVersion.V1_0);

      expect(spec.protocol).toBe('Food Open Rescue Protocol (FORP)');
      expect(spec.version).toBe(ForpVersion.V1_0);
      expect(spec.status).toBe('PROPOSED_STANDARD');
      expect(spec.schemas[ForpRecordType.FOOD_DONATION]).toBeDefined();
      expect(spec.schemas[ForpRecordType.DELIVERY_EVENT]).toBeDefined();
    });
  });

  describe('validatePayload', () => {
    it('should validate a compliant food donation record', () => {
      const validPayload = {
        donationId: 'don-001',
        donorOrganisationId: 'org-001',
        foodName: 'Fresh Apples and Oranges',
        category: 'human_consumption',
        quantity: 50.0,
        unit: 'kg',
      };

      const result = service.validatePayload(ForpRecordType.FOOD_DONATION, validPayload);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-compliant payload with missing mandatory fields', () => {
      const invalidPayload = {
        donationId: 'don-002',
        // Missing foodName, category, quantity, unit
      };

      const result = service.validatePayload(ForpRecordType.FOOD_DONATION, invalidPayload);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject negative quantities and invalid categories', () => {
      const invalidPayload = {
        donationId: 'don-003',
        donorOrganisationId: 'org-003',
        foodName: 'Bread',
        category: 'invalid_category_xyz',
        quantity: -10,
        unit: 'kg',
      };

      const result = service.validatePayload(ForpRecordType.FOOD_DONATION, invalidPayload);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid category'))).toBe(true);
      expect(result.errors.some((e) => e.includes('quantity must be a positive number'))).toBe(true);
    });
  });
});
