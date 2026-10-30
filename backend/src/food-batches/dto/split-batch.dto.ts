import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AnimalSpecies, FoodCategory } from '../../common/enums/app.enums';

export class ChildBatchDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  foodName?: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  quantityUnit: string;

  @IsEnum(FoodCategory)
  @IsNotEmpty()
  targetCategory: FoodCategory;

  @IsArray()
  @IsEnum(AnimalSpecies, { each: true })
  @IsOptional()
  targetSpecies?: AnimalSpecies[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  storageInstructions?: string;

  @IsDateString()
  @IsOptional()
  bestBeforeAt?: string;

  @IsDateString()
  @IsOptional()
  pickupDeadline?: string;
}

export class SplitBatchDto {
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChildBatchDto)
  children: ChildBatchDto[];
}
