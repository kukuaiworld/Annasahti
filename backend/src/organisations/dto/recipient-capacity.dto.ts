import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RecipientCapacityDto {
  @ApiPropertyOptional({
    description: 'Maximum refrigerated or dry storage capacity in kilograms (kg)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageCapacityKg?: number;

  @ApiProperty({
    description: 'Current intake quota or target requested quantity per distribution cycle',
    example: 150,
  })
  @IsNumber()
  @Min(0.001)
  requestedQuantity: number;

  @ApiProperty({
    description: 'Explicit measurement unit for requested quantity (e.g. kg, portions)',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;
}
