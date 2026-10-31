import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class DeliveryConfirmationDto {
  @ApiProperty({
    description: 'Actual received food quantity confirmed by the recipient organisation',
    example: 42.0,
  })
  @IsNumber()
  @Min(0, { message: 'receivedQuantity cannot be negative' })
  receivedQuantity: number;

  @ApiProperty({
    description: 'Explicit measurement unit for received quantity (must match allocation unit, e.g. kg)',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiPropertyOptional({
    description: 'Recipient notes or acceptance feedback',
    example: 'Delivered in good condition. 8 kg short of allocated quota due to transport spill.',
  })
  @IsOptional()
  @IsString()
  recipientNotes?: string;

  @ApiPropertyOptional({
    description: 'Evidence URLs submitted by recipient (e.g. weighbridge slip, signed receipt)',
    type: [String],
    example: ['https://storage.foodloop.org/evidence/delivery-receipt-001.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
