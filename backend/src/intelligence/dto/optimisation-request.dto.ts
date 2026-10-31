import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class OptimisationRequestDto {
  @ApiPropertyOptional({
    description: 'Maximum allowable direct transit distance in kilometers',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  maxDistanceKm?: number;

  @ApiPropertyOptional({
    description: 'Prioritize urgent food batches approaching expiry deadline',
    example: true,
  })
  @IsOptional()
  prioritizeUrgentDeadlines?: boolean;

  @ApiPropertyOptional({
    description: 'Operational priority focus (e.g. "maximize_redistribution", "minimize_distance")',
    example: 'maximize_redistribution',
  })
  @IsOptional()
  @IsString()
  objectiveStrategy?: string;
}
