import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { EmergencyType } from '../enums/simulation-scenario.enum';

export class EmergencyScenarioDto {
  @ApiProperty({
    description: 'Type of acute disruption or natural disaster event',
    enum: EmergencyType,
    example: EmergencyType.FLOODING,
  })
  @IsEnum(EmergencyType)
  emergencyType: EmergencyType;

  @ApiPropertyOptional({
    description: 'Target postal code, city district, or zone affected by disruption',
    example: 'Zone 4 - Coastal Lowlands',
  })
  @IsOptional()
  @IsString()
  affectedZone?: string;

  @ApiProperty({
    description: 'Operational context and severity assessment',
    example: 'Main arterial bridge blocked due to flash flood; South kitchen inaccessible.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 1000)
  description: string;
}
