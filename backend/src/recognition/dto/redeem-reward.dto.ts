import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RedeemRewardDto {
  @IsUUID()
  @IsNotEmpty()
  rewardId: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  requestNotes?: string;
}
