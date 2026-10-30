import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AllocationActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
