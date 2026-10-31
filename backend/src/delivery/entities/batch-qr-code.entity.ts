export class BatchQrCode {
  id: string;
  batchId: string;
  qrToken: string; // UUID token
  isActive: boolean;
  createdAt: Date;
  revokedAt?: Date;
}
