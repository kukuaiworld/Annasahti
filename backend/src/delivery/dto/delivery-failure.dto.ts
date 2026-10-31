import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class DeliveryFailureDto {
  @ApiProperty({
    description: 'Specific reason for delivery failure (e.g. recipient closed, transit accident, food damaged)',
    example: 'Recipient facility closed; no staff available to receive delivery',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Detailed circumstantial notes',
    example: 'Arrived at shelter at 19:30. Facility gates locked.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Evidence URLs supporting delivery failure report',
    type: [String],
    example: ['https://storage.foodloop.org/evidence/failed-delivery-001.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}
