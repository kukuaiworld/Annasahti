import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAllocationDto {
  @IsUUID()
  @IsNotEmpty()
  batchId: string;

  @IsUUID()
  @IsNotEmpty()
  recipientOrganisationId: string;

  @IsNumber()
  @IsPositive()
  allocatedQuantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  quantityUnit: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
