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
import { PlatformReviewerGuard } from '../guards/platform-reviewer.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { OrganisationsService } from '../services/organisations.service';
import { VerificationDecisionDto } from '../dto/verification-decision.dto';

@ApiTags('Admin Organisation Verification')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard, PlatformReviewerGuard)
@Controller('admin/organisations')
export class AdminOrganisationsController {
  constructor(private readonly orgService: OrganisationsService) {}

  @Get('pending')
  @ApiOperation({
    summary: 'List organisations pending verification',
    description:
      'Retrieves all organisations currently awaiting platform reviewer inspection and verification.',
  })
  @ApiResponse({ status: 200, description: 'List of pending organisations' })
  @ApiResponse({ status: 403, description: 'Platform reviewer privileges required' })
  async getPending() {
    return this.orgService.getPendingVerifications();
  }

  @Post(':id/verification-decision')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply platform verification decision',
    description:
      'Applies a verified, rejected, or suspended decision to an organisation. Self-approval is strictly prevented.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Decision applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification decision or reason missing' })
  @ApiResponse({
    status: 403,
    description: 'Platform reviewer privileges required, or reviewer self-approval attempted',
  })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async applyDecision(
    @Param('id') id: string,
    @Body() decisionDto: VerificationDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orgService.applyVerificationDecision(id, decisionDto, user.id);
  }
}
