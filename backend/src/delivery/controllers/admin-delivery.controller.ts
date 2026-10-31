import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { PlatformReviewerGuard } from '../../organisations/guards/platform-reviewer.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { DeliveryTasksService } from '../services/delivery-tasks.service';
import { ReassignTaskDto } from '../dto/reassign-task.dto';
import { DiscrepancyResolutionDto } from '../dto/discrepancy-resolution.dto';

@ApiTags('Admin Delivery Operations')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard, PlatformReviewerGuard)
@Controller('admin/delivery-tasks')
export class AdminDeliveryController {
  constructor(private readonly tasksService: DeliveryTasksService) {}

  @Post(':id/reassign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Administratively reassign a delivery task',
    description:
      'Reassigns an unfulfilled, cancelled or failed delivery task to an alternate active volunteer.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Task reassigned successfully' })
  @ApiResponse({ status: 403, description: 'Platform administrator privileges required' })
  async reassignTask(
    @Param('id') id: string,
    @Body() reassignDto: ReassignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.reassignTask(id, reassignDto, user.id);
  }

  @Post('discrepancies/:discrepancyId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Administratively resolve a quantity discrepancy',
    description:
      'Records authorized reconciliation decision for short pickup, damaged goods, or missing transit quantities.',
  })
  @ApiParam({ name: 'discrepancyId', description: 'Discrepancy record UUID' })
  @ApiResponse({ status: 200, description: 'Discrepancy resolved successfully' })
  @ApiResponse({ status: 403, description: 'Platform administrator privileges required' })
  async resolveDiscrepancy(
    @Param('discrepancyId') discrepancyId: string,
    @Body() resolutionDto: DiscrepancyResolutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.resolveDiscrepancy(
      discrepancyId,
      resolutionDto,
      user.id,
    );
  }

  @Post(':id/resolve-discrepancy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve discrepancy by delivery task ID',
    description:
      'Convenience endpoint to resolve the first active discrepancy for a delivery task.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Discrepancy resolved successfully' })
  async resolveTaskDiscrepancy(
    @Param('id') id: string,
    @Body() resolutionDto: DiscrepancyResolutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const discrepancies = await this.tasksService.getDiscrepancies(id);
    if (!discrepancies || discrepancies.length === 0) {
      throw new Error(`No discrepancies found for delivery task ${id}`);
    }
    return this.tasksService.resolveDiscrepancy(
      discrepancies[0].id,
      resolutionDto,
      user.id,
    );
  }
}
