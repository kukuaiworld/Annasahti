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
import { BatchQrService } from '../services/batch-qr.service';
import { QrResolveDto } from '../dto/qr-resolve.dto';

@ApiTags('Batch QR Identification')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('batches')
export class BatchQrController {
  constructor(private readonly qrService: BatchQrService) {}

  @Get(':id/qr')
  @ApiOperation({
    summary: 'Generate or retrieve secure QR identifier for a food batch',
    description:
      'Returns cryptographic QR token for batch packaging label. Does not expose PII.',
  })
  @ApiParam({ name: 'id', description: 'Food batch UUID' })
  @ApiResponse({ status: 200, description: 'Batch QR details' })
  async getBatchQr(@Param('id') id: string) {
    return this.qrService.generateOrGetQr(id);
  }

  @Post('resolve-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate scanned QR identifier server-side',
    description:
      'Validates active status and authenticity of a scanned QR token and resolves corresponding batch details.',
  })
  @ApiResponse({ status: 200, description: 'Resolved batch identification' })
  @ApiResponse({ status: 400, description: 'QR token invalid or revoked' })
  @ApiResponse({ status: 404, description: 'QR token unrecognized' })
  async resolveQr(@Body() resolveDto: QrResolveDto) {
    return this.qrService.resolveQrToken(resolveDto.qrToken);
  }
}
