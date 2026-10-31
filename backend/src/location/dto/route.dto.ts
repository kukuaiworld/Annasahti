import { IsLatitude, IsLongitude, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LatLngDto {
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;
}

export class CalculateRouteDto {
  @ValidateNested()
  @Type(() => LatLngDto)
  origin: LatLngDto;

  @ValidateNested()
  @Type(() => LatLngDto)
  destination: LatLngDto;
}
