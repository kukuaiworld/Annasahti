import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PrivacySettingsDto {
  @IsBoolean()
  @IsOptional()
  showFullNameOnLeaderboard?: boolean;

  @IsBoolean()
  @IsOptional()
  showMetricsPublicly?: boolean;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @IsObject()
  @IsOptional()
  privacySettings?: PrivacySettingsDto;
}
