import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TaskRejectionDto {
  @ApiProperty({
    description: 'Mandatory reason explaining why the volunteer rejected this delivery task',
    example: 'Vehicle breakdown / unavailable during specified pickup window',
  })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @Length(5, 500)
  reason: string;
}
