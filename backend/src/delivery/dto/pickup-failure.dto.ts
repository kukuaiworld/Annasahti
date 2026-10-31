import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class PickupFailureDto {
  @ApiProperty({
    description: 'Specific reason for pickup failure (e.g. donor unavailable, food spoiled, location inaccessible)',
    example: 'Donor premises closed and contact phone unreachable',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Detailed circumstantial notes',
    example: 'Waited 30 minutes at donor loading dock. Security confirmed kitchen closed.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Photo evidence URLs (e.g. closed gate, locked facility)',
    type: [String],
    example: ['https://storage.foodloop.org/evidence/failed-pickup-001.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
