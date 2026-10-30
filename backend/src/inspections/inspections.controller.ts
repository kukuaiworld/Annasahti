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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { InspectionQueryDto } from './dto/inspection-query.dto';

@Controller('inspections')
@UseGuards(AuthGuard, RolesGuard)
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('queue')
  @Roles(AppRole.INSPECTOR, AppRole.ADMIN)
  async getInspectionQueue(
    @Query() query: InspectionQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.getInspectionQueue(query, user);
  }

  @Get('batch/:batchId')
  async getBatchInspectionDetail(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.getBatchInspectionDetail(batchId, user);
  }

  @Post()
  @Roles(AppRole.INSPECTOR, AppRole.ADMIN)
  async recordInspection(
    @Body() dto: CreateInspectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.recordInspection(dto, user);
  }
}
