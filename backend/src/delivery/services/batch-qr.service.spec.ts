import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchQrService } from './batch-qr.service';
import { InMemoryDeliveryTaskRepository } from '../repositories/in-memory-delivery-task.repository';

describe('BatchQrService', () => {
  let service: BatchQrService;
  let repo: InMemoryDeliveryTaskRepository;
  const testBatchId = 'batch-uuid-1111';

  beforeEach(() => {
    repo = new InMemoryDeliveryTaskRepository();
    service = new BatchQrService(repo);
  });

  describe('generateOrGetQr', () => {
    it('should generate a new QR token for a batch', async () => {
      const qr = await service.generateOrGetQr(testBatchId);

      expect(qr.batchId).toBe(testBatchId);
      expect(qr.qrToken).toBeDefined();
      expect(qr.isActive).toBe(true);
    });

    it('should return existing active QR token for the same batch', async () => {
      const first = await service.generateOrGetQr(testBatchId);
      const second = await service.generateOrGetQr(testBatchId);

      expect(second.qrToken).toBe(first.qrToken);
    });
  });

  describe('resolveQrToken', () => {
    it('should resolve active QR token successfully', async () => {
      const created = await service.generateOrGetQr(testBatchId);
      const resolved = await service.resolveQrToken(created.qrToken);

      expect(resolved.batchId).toBe(testBatchId);
      expect(resolved.qrToken).toBe(created.qrToken);
    });

    it('should throw NotFoundException if token does not exist', async () => {
      await expect(service.resolveQrToken('unknown-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if QR token has been revoked', async () => {
      const created = await service.generateOrGetQr(testBatchId);
      await service.revokeQr(created.qrToken);

      await expect(service.resolveQrToken(created.qrToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
