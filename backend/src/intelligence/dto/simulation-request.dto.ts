import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SimulationScenarioType } from '../enums/simulation-scenario.enum';

export class SimulationRequestDto {
  @ApiProperty({
    description: 'Type of simulation scenario to model',
    enum: SimulationScenarioType,
    example: SimulationScenarioType.SURGE_DONATIONS,
  })
  @IsEnum(SimulationScenarioType)
  scenarioType: SimulationScenarioType;

  @ApiPropertyOptional({
    description: 'Percentage change in donor surplus volume (-100 to +500)',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(500)
  surplusVolumeChangePercent?: number;

  @ApiPropertyOptional({
    description: 'Percentage change in active volunteer availability (-100 to +200)',
    example: -30,
  })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(200)
  volunteerAvailabilityChangePercent?: number;

  @ApiPropertyOptional({
    description: 'Scenario title or description',
    example: 'Monsoon season volunteer dip with concurrent festive banquet surplus',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
