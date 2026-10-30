import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReassignVolunteerDto {
  @IsUUID()
  newVolunteerId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
