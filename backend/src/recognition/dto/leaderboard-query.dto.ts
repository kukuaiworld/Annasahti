import {
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(['monthly', 'yearly', 'all_time'])
  period: 'monthly' | 'yearly' | 'all_time' = 'monthly';

  @IsOptional()
  @IsIn(['deliveries', 'food_rescued_kg', 'hours'])
  metric: 'deliveries' | 'food_rescued_kg' | 'hours' = 'deliveries';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
