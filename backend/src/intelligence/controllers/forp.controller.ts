import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ForpService } from '../services/forp.service';
import { ForpValidateDto } from '../dto/forp-validate.dto';

@ApiTags('Open Rescue Protocol (FORP)')
@Controller('protocol/forp')
export class ForpController {
  constructor(private readonly forpService: ForpService) {}

  @Get(':version/schema')
  @ApiOperation({
    summary: 'Get versioned Open Rescue Protocol (FORP) specification and schemas',
    description:
      'Returns standard JSON schemas (draft-07) and event contracts for interoperable food rescue data exchange.',
  })
  @ApiParam({ name: 'version', description: 'Protocol version (e.g. v1.0.0, v0.1.0-draft)', example: 'v1.0.0' })
  @ApiResponse({ status: 200, description: 'Protocol specification' })
  async getSchema(@Param('version') version: string) {
    return this.forpService.getProtocolSpecification(version);
  }

  @Post(':version/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate payload against Open Rescue Protocol (FORP) schema',
    description:
      'Validates incoming external partner records (donations, allocations, events) against versioned FORP schemas.',
  })
  @ApiParam({ name: 'version', description: 'Protocol version', example: 'v1.0.0' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  @ApiResponse({ status: 400, description: 'Validation failed or unrecognized record type' })
  async validatePayload(
    @Param('version') _version: string,
    @Body() validateDto: ForpValidateDto,
  ) {
    return this.forpService.validatePayload(
      validateDto.recordType,
      validateDto.payload,
    );
  }
}
