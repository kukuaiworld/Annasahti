import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PickupDeliveryDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  pickupNotes?: string;
}
