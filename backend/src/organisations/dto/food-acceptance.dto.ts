import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { FoodCategory } from '../enums/food-category.enum';

export class FoodAcceptanceDto {
  @ApiProperty({
    description: 'Categories of food accepted by the recipient organisation',
    enum: FoodCategory,
    isArray: true,
    example: [FoodCategory.HUMAN_CONSUMPTION],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(FoodCategory, { each: true })
  acceptedCategories: FoodCategory[];
}
