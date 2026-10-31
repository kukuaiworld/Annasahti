import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
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

export class UpdateOrganisationDto {
  @ApiPropertyOptional({
    description: 'Updated name of the organisation',
    example: 'Annapurna Community Foundation',
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated organisation category type',
    enum: OrganisationType,
  })
  @IsOptional()
  @IsEnum(OrganisationType)
  organisationType?: OrganisationType;

  @ApiPropertyOptional({
    description: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated physical address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Updated contact email',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Updated contact phone number',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Updated latitude',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Updated longitude',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Updated operating hours',
    type: () => OperatingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;
}
