import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignVolunteerDto {
  @IsUUID()
  volunteerId: string;

  @IsDateString()
  @IsOptional()
  pickupDeadline?: string;

  @IsDateString()
  @IsOptional()
  deliveryDeadline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  deliveryNotes?: string;
}
