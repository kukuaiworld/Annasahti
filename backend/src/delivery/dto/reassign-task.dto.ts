import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReassignTaskDto {
  @ApiProperty({
    description: 'UUID of the replacement volunteer to assign to this delivery task',
    example: 'b0000000-0000-0000-0000-000000000002',
  })
  @IsUUID('4', { message: 'volunteerId must be a valid UUID' })
  @IsNotEmpty()
  volunteerId: string;

  @ApiPropertyOptional({
    description: 'Reason for administrative reassignment',
    example: 'Original volunteer vehicle breakdown; reassigning to available zone volunteer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
