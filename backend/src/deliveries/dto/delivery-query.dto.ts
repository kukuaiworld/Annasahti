import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export enum DeliveryQueryStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  PICKUP_CONFIRMED = 'pickup_confirmed',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class DeliveryQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(DeliveryQueryStatus)
  status?: DeliveryQueryStatus;

  @IsOptional()
  @IsUUID()
  volunteerId?: string;

  @IsOptional()
  @IsUUID()
  allocationId?: string;
}
