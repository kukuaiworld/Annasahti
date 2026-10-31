import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DELIVERY_TASK_REPOSITORY,
  IDeliveryTaskRepository,
} from '../repositories/delivery-task.repository.interface';
import { BatchQrCode } from '../entities/batch-qr-code.entity';

@Injectable()
export class BatchQrService {
  constructor(
    @Inject(DELIVERY_TASK_REPOSITORY)
    private readonly taskRepo: IDeliveryTaskRepository,
  ) {}

  async generateOrGetQr(batchId: string): Promise<BatchQrCode> {
    const existing = await this.taskRepo.findQrCodeByBatchId(batchId);
    if (existing && existing.isActive) {
      return existing;
    }

    return this.taskRepo.createQrCode(batchId);
  }

  async resolveQrToken(qrToken: string): Promise<BatchQrCode> {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new BadRequestException('Invalid QR token format');
    }

    const qr = await this.taskRepo.findQrCodeByToken(qrToken.trim());
    if (!qr) {
      throw new NotFoundException(`QR code token "${qrToken}" not found or unrecognized`);
    }

    if (!qr.isActive) {
      throw new BadRequestException(
        'QR code is inactive or revoked. Cannot be used for identification.',
      );
    }

    return qr;
  }

  async revokeQr(qrToken: string): Promise<BatchQrCode> {
    const qr = await this.resolveQrToken(qrToken);
    return this.taskRepo.revokeQrCode(qr.qrToken);
  }
}
