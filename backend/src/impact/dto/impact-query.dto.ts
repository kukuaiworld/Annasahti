import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImpactQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';
}

export class ImpactTrendsQueryDto extends ImpactQueryDto {
  @IsOptional()
  @IsIn(['monthly', 'yearly'])
  period: 'monthly' | 'yearly' = 'monthly';
}

export class ImpactReportQueryDto extends ImpactQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn(['human_consumption', 'animal_appropriate', 'organic_waste'])
  category?: 'human_consumption' | 'animal_appropriate' | 'organic_waste';
}
