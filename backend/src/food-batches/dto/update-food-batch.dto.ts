import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateFoodBatchDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  foodName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  estimatedWeightKg?: number;

  @IsDateString()
  @IsOptional()
  preparedAt?: string;

  @IsDateString()
  @IsOptional()
  bestBeforeAt?: string;

  @IsDateString()
  @IsOptional()
  pickupDeadline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  storageInstructions?: string;
}
