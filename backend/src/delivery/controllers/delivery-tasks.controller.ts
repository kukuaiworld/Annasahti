import {
  Body,
  Controller,
  Get,
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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { DeliveryTasksService } from '../services/delivery-tasks.service';
import { SafeChainService } from '../services/safechain.service';
import { TaskRejectionDto } from '../dto/task-rejection.dto';
import { PickupConfirmationDto } from '../dto/pickup-confirmation.dto';
import { PickupFailureDto } from '../dto/pickup-failure.dto';
import { DeliveryConfirmationDto } from '../dto/delivery-confirmation.dto';
import { DeliveryFailureDto } from '../dto/delivery-failure.dto';

@ApiTags('Delivery Tasks')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('delivery-tasks')
export class DeliveryTasksController {
  constructor(
    private readonly tasksService: DeliveryTasksService,
    private readonly safeChainService: SafeChainService,
  ) {}

  @Get('available')
  @ApiOperation({
    summary: 'List available delivery tasks for volunteers',
    description:
      'Retrieves unassigned tasks open for volunteer acceptance without exposing private contact info.',
  })
  @ApiResponse({ status: 200, description: 'List of available tasks' })
  async getAvailableTasks() {
    return this.tasksService.getAvailableTasks();
  }

  @Get('my-tasks')
  @ApiOperation({
    summary: 'List tasks assigned to the authenticated volunteer',
    description: 'Retrieves all tasks accepted by or assigned to the current volunteer.',
  })
  @ApiResponse({ status: 200, description: 'List of assigned tasks' })
  async getMyTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.getMyTasks(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'View delivery task details',
    description:
      'Retrieves complete task details. Accessible only to authorized volunteers, donor/recipient representatives, or administrators.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.getTaskById(id, user);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Volunteer accepts a delivery task',
    description:
      'Atomically binds the authenticated volunteer to the delivery task, preventing race conditions.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Task accepted successfully' })
  @ApiResponse({ status: 409, description: 'Task already accepted or assigned to another volunteer' })
  async acceptTask(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.acceptTask(id, user.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Volunteer rejects an assigned task',
    description:
      'Releases the volunteer assignment and resets task to available for reassignment. Reason is mandatory.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Task rejected and returned to pool' })
  @ApiResponse({ status: 403, description: 'Cannot reject task assigned to another volunteer' })
  async rejectTask(
    @Param('id') id: string,
    @Body() rejectionDto: TaskRejectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.rejectTask(id, user.id, rejectionDto);
  }

  @Post(':id/pickup-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm food collection at donor premises',
    description:
      'Validates scanned QR token server-side, records collected quantity, logs temperature observations and discrepancies.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Pickup confirmed; task transitioned to in_transit' })
  @ApiResponse({ status: 400, description: 'Invalid QR token, unit mismatch, or quantity error' })
  @ApiResponse({ status: 403, description: 'User is not the assigned volunteer' })
  async confirmPickup(
    @Param('id') id: string,
    @Body() pickupDto: PickupConfirmationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.confirmPickup(id, user.id, pickupDto);
  }

  @Post(':id/pickup-failure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report pickup failure',
    description:
      'Reports that food could not be collected (e.g. donor closed, food spoiled). Transitions task to failed.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Pickup failure recorded' })
  async reportPickupFailure(
    @Param('id') id: string,
    @Body() failureDto: PickupFailureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.reportPickupFailure(id, user.id, failureDto);
  }

  @Post(':id/delivery-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm delivery receipt by recipient organisation',
    description:
      'Records actual received quantity independently from allocated and collected quantities. Enforces partial delivery accounting.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Delivery receipt recorded; task marked delivered' })
  @ApiResponse({ status: 403, description: 'Volunteers cannot confirm delivery receipt' })
  @ApiResponse({ status: 409, description: 'Delivery confirmation already recorded' })
  async confirmDelivery(
    @Param('id') id: string,
    @Body() deliveryDto: DeliveryConfirmationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.confirmDelivery(id, user.id, deliveryDto);
  }

  @Post(':id/delivery-failure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report transit or delivery failure',
    description:
      'Reports failure during transit or at recipient destination. Transitions task to failed.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Delivery failure recorded' })
  async reportDeliveryFailure(
    @Param('id') id: string,
    @Body() failureDto: DeliveryFailureDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.reportDeliveryFailure(id, failureDto, user.id);
  }

  @Get(':id/discrepancies')
  @ApiOperation({
    summary: 'Get quantity discrepancies for a delivery task',
    description:
      'Retrieves all recorded quantity discrepancies (short pickup, transit loss, partial delivery) for audit.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'List of recorded discrepancies' })
  async getDiscrepancies(@Param('id') id: string) {
    return this.tasksService.getDiscrepancies(id);
  }

  @Get(':id/events')
  @ApiOperation({
    summary: 'Get chronological event history for a delivery task',
    description: 'Retrieves complete append-only audit trail for this delivery task.',
  })
  @ApiParam({ name: 'id', description: 'Delivery task UUID' })
  @ApiResponse({ status: 200, description: 'Event history' })
  async getTaskEvents(@Param('id') id: string) {
    return this.safeChainService.getEventsByTask(id);
  }
}
