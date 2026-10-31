import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { LocationService } from './location.service';
import { GeocodeQueryDto } from './dto/geocode.dto';
import { CalculateRouteDto } from './dto/route.dto';

@Controller('location')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('geocode')
  async geocodeAddress(@Query() query: GeocodeQueryDto) {
    return this.locationService.geocodeAddress(query.address);
  }

  @Post('routes')
  async calculateRoute(@Body() dto: CalculateRouteDto) {
    return this.locationService.calculateRoute(dto.origin, dto.destination);
  }
}
