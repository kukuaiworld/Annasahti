import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class QrResolveDto {
  @ApiProperty({
    description: 'Cryptographic QR token scanned from the batch packaging label',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsUUID('4', { message: 'qrToken must be a valid UUID' })
  @IsNotEmpty()
  qrToken: string;
}
