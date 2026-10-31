import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CounterfactualRequestDto {
  @ApiPropertyOptional({
    description: 'Start of analysis period (ISO 8601 string)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End of analysis period (ISO 8601 string)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Estimated non-intervention discard probability baseline (0.0 to 1.0)',
    example: 0.65,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  baselineDiscardRate?: number;
}
