import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
