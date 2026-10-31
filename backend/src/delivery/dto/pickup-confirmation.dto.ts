import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class PickupConfirmationDto {
  @ApiProperty({
    description: 'Scanned QR code cryptographic token from the physical batch label',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsUUID('4', { message: 'qrToken must be a valid UUID' })
  @IsNotEmpty()
  qrToken: string;

  @ApiProperty({
    description: 'Actual collected food quantity at donor premises',
    example: 45.5,
  })
  @IsNumber()
  @Min(0.001, { message: 'collectedQuantity must be greater than zero' })
  collectedQuantity: number;

  @ApiProperty({
    description: 'Explicit measurement unit for collected quantity (must match allocation unit, e.g. kg, portions)',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiPropertyOptional({
    description: 'Recorded ambient or food temperature in Celsius at pickup',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  temperatureC?: number;

  @ApiPropertyOptional({
    description: 'Volunteer observations regarding food handling, hygiene or packaging integrity',
    example: 'Insulated thermal boxes used; packaging sealed and intact.',
  })
  @IsOptional()
  @IsString()
  handlingNotes?: string;

  @ApiPropertyOptional({
    description: 'Evidence or photo URLs verifying physical collection',
    type: [String],
    example: ['https://storage.foodloop.org/evidence/pickup-001.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
