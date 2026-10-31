import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FoodCategory } from '../enums/food-category.enum';

export class DietaryRequirementsDto {
  @ApiPropertyOptional({ description: 'Accepts vegetarian food only', example: false })
  @IsOptional()
  @IsBoolean()
  isVegetarianOnly?: boolean;

  @ApiPropertyOptional({ description: 'Accepts vegan food only', example: false })
  @IsOptional()
  @IsBoolean()
  isVeganOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Prohibited allergens to protect recipients (e.g. peanuts, gluten, dairy)',
    type: [String],
    example: ['peanuts', 'tree_nuts'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prohibitedAllergens?: string[];

  @ApiPropertyOptional({ description: 'Requires certified Halal food', example: false })
  @IsOptional()
  @IsBoolean()
  halalCertifiedRequired?: boolean;

  @ApiPropertyOptional({ description: 'Requires certified Kosher food', example: false })
  @IsOptional()
  @IsBoolean()
  kosherCertifiedRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Additional dietary notes or guidelines',
    example: 'Low sodium preferred for elder care',
  })
  @IsOptional()
  @IsString()
  customDietaryNotes?: string;
}

export class SpeciesRequirementsDto {
  @ApiProperty({
    description: 'Target animal species receiving food (e.g. canine, feline, bovine, equine)',
    type: [String],
    example: ['canine', 'feline'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetSpecies: string[];

  @ApiPropertyOptional({
    description: 'Ingredients strictly prohibited or toxic for these species (e.g. onions, chocolate, xylitol)',
    type: [String],
    example: ['alliums', 'theobromine', 'xylitol', 'grapes'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prohibitedIngredients?: string[];

  @ApiPropertyOptional({
    description: 'Species-specific handling or food preparation instructions',
    example: 'Keep raw meat separate and frozen until feed preparation',
  })
  @IsOptional()
  @IsString()
  handlingInstructions?: string;
}

export class UpdateRecipientRequirementsDto {
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

  @ApiProperty({
    description: 'Current intake quota or requested quantity per cycle',
    example: 100,
  })
  @IsNumber()
  @Min(0.001)
  requestedQuantity: number;

  @ApiProperty({
    description: 'Measurement unit for requested quantity (e.g. kg, portions)',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @ApiPropertyOptional({
    description: 'Storage capacity in kilograms (kg)',
    example: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageCapacityKg?: number;

  @ApiPropertyOptional({
    description: 'Structured human dietary requirements',
    type: DietaryRequirementsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DietaryRequirementsDto)
  dietaryRequirements?: DietaryRequirementsDto;

  @ApiPropertyOptional({
    description: 'Species-specific requirements for animal welfare recipients',
    type: SpeciesRequirementsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpeciesRequirementsDto)
  speciesRequirements?: SpeciesRequirementsDto;

  @ApiPropertyOptional({
    description: 'Additional legacy or free-text requirements',
    example: 'Must deliver between 10 AM and 2 PM',
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}
