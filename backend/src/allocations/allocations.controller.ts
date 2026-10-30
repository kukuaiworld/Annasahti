import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AllocationsService } from './allocations.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { AllocationActionDto } from './dto/allocation-action.dto';
import { AllocationQueryDto } from './dto/allocation-query.dto';

@Controller('allocations')
@UseGuards(AuthGuard)
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Post()
  async createAllocation(
    @Body() dto: CreateAllocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.createAllocation(dto, user);
  }

  @Get()
  async listAllocations(
    @Query() query: AllocationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.listAllocations(query, user);
  }

  @Get(':id')
  async getAllocationById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.getAllocationById(id, user);
  }

  @Post(':id/accept')
  async acceptAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.acceptAllocation(id, user);
  }

  @Post(':id/reject')
  async rejectAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AllocationActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.rejectAllocation(id, dto.reason, user);
  }

  @Post(':id/cancel')
  async cancelAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AllocationActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.allocationsService.cancelAllocation(id, dto.reason, user);
  }
}
