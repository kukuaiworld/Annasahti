import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GenerateCertificateDto {
  @IsUUID()
  @IsOptional()
  volunteerId?: string;

  @IsString()
  @IsNotEmpty()
  certificateType: string; // e.g. 'ACHIEVEMENT_RECOGNITION', 'VOLUNTEER_OF_THE_MONTH', 'SERVICE_MILESTONE'

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  achievementCode?: string;
}
