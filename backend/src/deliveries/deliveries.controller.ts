import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { DeliveriesService } from './deliveries.service';
import { AssignVolunteerDto } from './dto/assign-volunteer.dto';
import { ReassignVolunteerDto } from './dto/reassign-volunteer.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';
import { PickupDeliveryDto } from './dto/pickup-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { DeliveryQueryDto } from './dto/delivery-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('deliveries')
@UseGuards(AuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async listDeliveries(
    @Query() query: DeliveryQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.listDeliveries(query, user);
  }

  @Get(':deliveryId')
  async getDeliveryById(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.getDeliveryById(deliveryId, user);
  }

  @Post(':deliveryId/claim')
  async claimDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.claimDelivery(deliveryId, user);
  }

  @Post(':deliveryId/assign')
  async assignVolunteer(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: AssignVolunteerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.assignVolunteer(deliveryId, dto, user);
  }

  @Post(':deliveryId/reassign')
  async reassignVolunteer(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: ReassignVolunteerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.reassignVolunteer(deliveryId, dto, user);
  }

  @Post(':deliveryId/cancel')
  async cancelDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: CancelDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.cancelDelivery(deliveryId, dto, user);
  }

  @Post(':deliveryId/pickup')
  async recordPickup(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: PickupDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.recordPickup(deliveryId, dto, user);
  }

  @Post(':deliveryId/complete')
  async completeDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: CompleteDeliveryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.completeDelivery(deliveryId, dto, user);
  }

  @Patch(':deliveryId/location')
  async updateVolunteerLocation(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deliveriesService.updateVolunteerLocation(deliveryId, dto, user);
  }
}
