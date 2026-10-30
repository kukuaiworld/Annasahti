import { IsNotEmpty, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class VolunteerOfTheMonthDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'recognitionPeriod must be in YYYY-MM format (e.g. 2026-10)' })
  @IsNotEmpty()
  recognitionPeriod: string;

  @IsUUID()
  @IsNotEmpty()
  volunteerId: string;

  @IsString()
  @MaxLength(500)
  @IsNotEmpty()
  selectionNotes: string;
}
