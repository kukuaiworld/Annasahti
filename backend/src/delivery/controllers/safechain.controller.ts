import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { SafeChainService } from '../services/safechain.service';

@ApiTags('SafeChain Traceability')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('batches')
export class SafeChainController {
  constructor(private readonly safeChainService: SafeChainService) {}

  @Get(':id/safechain')
  @ApiOperation({
    summary: 'Get SafeChain traceability event history for a food batch',
    description:
      'Retrieves the complete append-only event ledger across preparation, inspection, allocation, pickup, transit, and delivery.',
  })
  @ApiParam({ name: 'id', description: 'Food batch UUID' })
  @ApiResponse({ status: 200, description: 'Chronological SafeChain event history' })
  async getBatchSafeChain(@Param('id') id: string) {
    return this.safeChainService.getEventsByBatch(id);
  }
}
