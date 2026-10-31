import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrganisationType } from '../enums/organisation-type.enum';
import { OperatingHoursDto } from './operating-hours.dto';

export class CreateOrganisationDto {
  @ApiProperty({
    description: 'Legal or operating name of the organisation',
    example: 'Annapurna Community Kitchen',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @ApiProperty({
    description: 'Organisation type category according to approved database schema',
    enum: OrganisationType,
    example: OrganisationType.HUMANITARIAN_NGO,
  })
  @IsEnum(OrganisationType)
  organisationType: OrganisationType;

  @ApiPropertyOptional({
    description: 'Short profile description or mission statement',
    example: 'Serving hot nutritious meals to underserved communities.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Physical operational or headquarters address',
    example: '123 Market Road, Mumbai, Maharashtra 400001',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Primary contact email address',
    example: 'contact@annapurna.org',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Primary contact phone number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Geographic latitude coordinate (-90 to +90)',
    example: 19.076,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Geographic longitude coordinate (-180 to +180)',
    example: 72.8777,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Initial operating hours and weekly schedules',
    type: () => OperatingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;
}
