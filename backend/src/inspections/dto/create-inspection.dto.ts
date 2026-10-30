import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AnimalSpecies, InspectionDecision } from '../../common/enums/app.enums';

export class CreateInspectionDto {
  @IsUUID()
  @IsNotEmpty()
  batchId: string;

  @IsEnum(InspectionDecision)
  @IsNotEmpty()
  decision: InspectionDecision;

  @IsBoolean()
  @IsOptional()
  isAiAssessed?: boolean = false;

  @IsBoolean()
  @IsOptional()
  humanVerified?: boolean = true;

  @IsArray()
  @IsEnum(AnimalSpecies, { each: true })
  @IsOptional()
  targetSpecies?: AnimalSpecies[];

  @IsNumber()
  @IsOptional()
  temperatureC?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  packagingCondition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  appearanceCondition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  odourCondition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  handlingNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rejectionReason?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceUrls?: string[];

  @IsOptional()
  safetyChecklist?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  inspectionNotes?: string;
}
