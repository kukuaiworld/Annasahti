import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFoodBatchDto {
  @IsUUID()
  @IsNotEmpty()
  donorOrganisationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  foodName: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  quantityUnit: string;

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
