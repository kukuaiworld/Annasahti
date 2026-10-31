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
import { FoodBatchesService } from './food-batches.service';
import { CreateFoodBatchDto } from './dto/create-food-batch.dto';
import { UpdateFoodBatchDto } from './dto/update-food-batch.dto';
import { BatchQueryDto } from './dto/batch-query.dto';
import { SplitBatchDto } from './dto/split-batch.dto';

@Controller('batches')
@UseGuards(AuthGuard)
export class FoodBatchesController {
  constructor(private readonly batchesService: FoodBatchesService) {}

  @Post()
  async createBatch(
    @Body() dto: CreateFoodBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.createBatch(dto, user);
  }

  @Get()
  async listBatches(
    @Query() query: BatchQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.listBatches(query, user);
  }

  /**
   * Phase 0 (Task F): donor dashboard summary.
   * Declared before ':id' routes so 'summary' is not captured as a UUID param.
   */
  @Get('summary')
  async getBatchSummary(@CurrentUser() user: AuthUser) {
    return this.batchesService.getBatchSummary(user);
  }

  @Get(':id')
  async getBatchById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.getBatchById(id, user);
  }

  @Patch(':id')
  async updateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFoodBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.updateBatch(id, dto, user);
  }

  @Post(':id/cancel')
  async cancelBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.cancelBatch(id, reason, user);
  }

  @Post(':id/split')
  async splitBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SplitBatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.splitBatch(id, dto, user);
  }

  @Get(':id/history')
  async getBatchHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.batchesService.getBatchHistory(id, user);
  }
}
