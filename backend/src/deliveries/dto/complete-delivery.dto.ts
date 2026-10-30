import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CompleteDeliveryDto {
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  damagedQuantity?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  missingQuantity?: number = 0;

  @IsString()
  @IsNotEmpty()
  quantityUnit: string;

  @IsString()
  @IsOptional()
  discrepancyReason?: string;

  @IsBoolean()
  @IsOptional()
  canBeDivertedToWaste?: boolean = false;

  @IsString()
  @IsOptional()
  recipientNotes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceUrls?: string[];
}
