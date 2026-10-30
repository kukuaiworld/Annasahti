import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { FoodBatchStatus, FoodCategory } from '../../common/enums/app.enums';

export class BatchQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(FoodBatchStatus)
  status?: FoodBatchStatus;

  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsOptional()
  @IsUUID()
  donorOrganisationId?: string;

  @IsOptional()
  @IsDateString()
  expiryAfter?: string;

  @IsOptional()
  @IsDateString()
  pickupBefore?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
