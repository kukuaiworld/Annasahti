import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ORGANISATION_TYPES = [
  'restaurant',
  'hotel',
  'caterer',
  'humanitarian_ngo',
  'orphanage',
  'government_school',
  'old_age_home',
  'animal_welfare_ngo',
  'waste_processor',
  'other',
] as const;

export class CreateOrganisationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsIn(ORGANISATION_TYPES)
  organisationType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  /** GeoJSON point as provided by the frontend: [lng, lat] */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  location?: [number, number];

  @IsOptional()
  @IsObject()
  @MaxLength(1000)
  operatingHours?: Record<string, unknown>;
}

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @ArrayMaxSize(2)
  location?: [number, number];

  @IsOptional()
  @IsObject()
  @MaxLength(1000)
  operatingHours?: Record<string, unknown>;
}

export class VerifyOrganisationDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}

export class AddOrganisationMemberDto {
  @IsUUID()
  userId!: string;

  @IsIn(['donor', 'recipient', 'volunteer', 'inspector', 'admin'])
  role!: string;
}

export class RecipientRequirementsDto {
  @IsArray()
  @ArrayMaxSize(5)
  @IsIn(['human_consumption', 'animal_appropriate', 'organic_waste'], { each: true })
  acceptedCategories!: string[];

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(1000000)
  requestedQuantity!: number;

  @IsString()
  @MaxLength(50)
  quantityUnit!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  storageCapacityKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequirements?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsIn(['canine', 'feline', 'bovine', 'porcine', 'poultry', 'equine', 'other'], { each: true })
  supportedSpecies?: string[];
}
