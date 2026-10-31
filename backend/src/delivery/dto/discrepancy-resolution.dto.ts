import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { DiscrepancyStatus } from '../enums/discrepancy.enum';

export class DiscrepancyResolutionDto {
  @ApiProperty({
    description: 'Updated resolution status',
    enum: DiscrepancyStatus,
    example: DiscrepancyStatus.RESOLVED,
  })
  @IsEnum(DiscrepancyStatus)
  status: DiscrepancyStatus;

  @ApiProperty({
    description: 'Detailed explanation of the discrepancy resolution and quantity reconciliation',
    example: 'Spill incident verified. Shortage of 8 kg accounted as transit loss; insurance claim filed.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  resolutionNotes: string;
}
