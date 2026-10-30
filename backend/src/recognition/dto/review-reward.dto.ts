import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRewardDto {
  @IsString()
  @IsIn(['approved', 'fulfilled', 'rejected'])
  @IsNotEmpty()
  status: 'approved' | 'fulfilled' | 'rejected';

  @IsString()
  @MaxLength(300)
  @IsOptional()
  reviewReason?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  fulfillmentDetails?: string;
}
