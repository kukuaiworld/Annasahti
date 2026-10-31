import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class DayOperatingHoursDto {
  @ApiPropertyOptional({
    description: 'Opening time in 24h format (HH:mm)',
    example: '09:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'open must be in HH:mm 24-hour format',
  })
  open?: string;

  @ApiPropertyOptional({
    description: 'Closing time in 24h format (HH:mm)',
    example: '18:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'close must be in HH:mm 24-hour format',
  })
  close?: string;

  @ApiPropertyOptional({
    description: 'Whether the organisation is closed on this day',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class OperatingHoursDto {
  @ApiProperty({
    description: 'IANA Timezone identifier',
    example: 'Asia/Kolkata',
  })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  monday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  tuesday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  wednesday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  thursday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  friday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  saturday?: DayOperatingHoursDto;

  @ApiPropertyOptional({ type: DayOperatingHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayOperatingHoursDto)
  sunday?: DayOperatingHoursDto;
}
