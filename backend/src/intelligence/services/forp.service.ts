import { BadRequestException, Injectable } from '@nestjs/common';
import { ForpRecordType, ForpVersion } from '../enums/forp-version.enum';
import { ForpProtocolSpecification } from '../entities/forp-schema.entity';

@Injectable()
export class ForpService {
  private readonly schemas: Record<ForpRecordType, Record<string, unknown>> = {
    [ForpRecordType.FOOD_DONATION]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Food Donation Record',
      type: 'object',
      required: ['donationId', 'donorOrganisationId', 'foodName', 'category', 'quantity', 'unit'],
      properties: {
        donationId: { type: 'string' },
        donorOrganisationId: { type: 'string' },
        foodName: { type: 'string' },
        category: {
          type: 'string',
          enum: ['human_consumption', 'animal_appropriate', 'organic_waste'],
        },
        quantity: { type: 'number', minimum: 0.001 },
        unit: { type: 'string', enum: ['kg', 'portions'] },
        preparedAt: { type: 'string', format: 'date-time' },
        bestBeforeAt: { type: 'string', format: 'date-time' },
        storageInstructions: { type: 'string' },
      },
    },
    [ForpRecordType.BATCH_IDENTIFICATION]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Batch Identification',
      type: 'object',
      required: ['batchId', 'batchCode', 'qrToken'],
      properties: {
        batchId: { type: 'string' },
        batchCode: { type: 'string' },
        qrToken: { type: 'string' },
      },
    },
    [ForpRecordType.RECIPIENT_ALLOCATION]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Recipient Allocation Record',
      type: 'object',
      required: ['allocationId', 'batchId', 'recipientOrganisationId', 'allocatedQuantity', 'unit'],
      properties: {
        allocationId: { type: 'string' },
        batchId: { type: 'string' },
        recipientOrganisationId: { type: 'string' },
        allocatedQuantity: { type: 'number', minimum: 0.001 },
        unit: { type: 'string' },
      },
    },
    [ForpRecordType.PICKUP_EVENT]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Pickup Event',
      type: 'object',
      required: ['taskId', 'batchId', 'volunteerId', 'collectedQuantity', 'unit', 'timestamp'],
      properties: {
        taskId: { type: 'string' },
        batchId: { type: 'string' },
        volunteerId: { type: 'string' },
        collectedQuantity: { type: 'number', minimum: 0.001 },
        unit: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    [ForpRecordType.DELIVERY_EVENT]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Delivery Event',
      type: 'object',
      required: ['taskId', 'batchId', 'confirmedBy', 'receivedQuantity', 'unit', 'timestamp'],
      properties: {
        taskId: { type: 'string' },
        batchId: { type: 'string' },
        confirmedBy: { type: 'string' },
        receivedQuantity: { type: 'number', minimum: 0 },
        unit: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    [ForpRecordType.PROCESSING_CONFIRMATION]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Waste Processing Confirmation',
      type: 'object',
      required: ['batchId', 'processorId', 'processedWeightKg', 'method'],
      properties: {
        batchId: { type: 'string' },
        processorId: { type: 'string' },
        processedWeightKg: { type: 'number', minimum: 0.001 },
        method: { type: 'string' },
      },
    },
    [ForpRecordType.IMPACT_REPORT]: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'FORP Impact Report',
      type: 'object',
      required: ['metricType', 'metricValue', 'unit', 'periodStart', 'periodEnd'],
      properties: {
        metricType: { type: 'string' },
        metricValue: { type: 'number' },
        unit: { type: 'string' },
        periodStart: { type: 'string', format: 'date' },
        periodEnd: { type: 'string', format: 'date' },
      },
    },
  };

  getProtocolSpecification(version: string = ForpVersion.V1_0): ForpProtocolSpecification {
    return {
      protocol: 'Food Open Rescue Protocol (FORP)',
      version: version === ForpVersion.DRAFT ? ForpVersion.DRAFT : ForpVersion.V1_0,
      status: 'PROPOSED_STANDARD',
      specificationUrl: 'https://docs.foodloop.org/protocol/forp/v1.0.0',
      schemas: this.schemas,
      eventDefinitions: [
        'forp.donation.created',
        'forp.batch.inspected',
        'forp.batch.allocated',
        'forp.delivery.picked_up',
        'forp.delivery.completed',
        'forp.delivery.partial',
        'forp.waste.processed',
      ],
      interoperabilityGuidelines: [
        'All quantities must be transmitted with explicit ISO/metric units (e.g. kg, portions).',
        'PII must never be included in public batch or event tokens.',
        'External partner submissions must include idempotent transaction UUIDs.',
      ],
    };
  }

  validatePayload(
    recordType: ForpRecordType,
    payload: Record<string, unknown>,
  ): { isValid: boolean; errors: string[] } {
    const schema = this.schemas[recordType];
    if (!schema) {
      throw new BadRequestException(`Unrecognized FORP record type: ${recordType}`);
    }

    const errors: string[] = [];
    const required = (schema.required as string[]) || [];

    for (const reqField of required) {
      if (payload[reqField] === undefined || payload[reqField] === null || payload[reqField] === '') {
        errors.push(`Missing required field: "${reqField}"`);
      }
    }

    // Category check
    if (payload.category && !['human_consumption', 'animal_appropriate', 'organic_waste'].includes(String(payload.category))) {
      errors.push(`Invalid category: "${payload.category}". Must be human_consumption, animal_appropriate, or organic_waste.`);
    }

    // Quantity check
    if (payload.quantity !== undefined && (typeof payload.quantity !== 'number' || payload.quantity <= 0)) {
      errors.push('quantity must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
