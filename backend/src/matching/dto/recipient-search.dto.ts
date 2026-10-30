import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { AnimalSpecies, FoodCategory } from '../../common/enums/app.enums';

export class RecipientSearchDto {
  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsPositive()
  radiusKm?: number = 25;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
