import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { VerificationStatus } from '../enums/verification-status.enum';

export enum ReviewDecisionType {
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export class VerificationDecisionDto {
  @ApiProperty({
    description: 'Decision status for the organisation verification request',
    enum: ReviewDecisionType,
    example: ReviewDecisionType.VERIFIED,
  })
  @IsEnum(ReviewDecisionType)
  decision: ReviewDecisionType;

  @ApiPropertyOptional({
    description: 'Mandatory reason when rejecting an organisation verification request',
    example: 'Submitted certificate expired on 2025-12-31. Please upload active license.',
  })
  @ValidateIf((o: VerificationDecisionDto) => o.decision === ReviewDecisionType.REJECTED)
  @IsNotEmpty({ message: 'rejectionReason is mandatory when decision is rejected' })
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Internal reviewer audit notes',
    example: 'Verified against state registry database on 2026-10-31.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
