import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { ImpactService } from './impact.service';
import {
  ImpactQueryDto,
  ImpactTrendsQueryDto,
  ImpactReportQueryDto,
} from './dto/impact-query.dto';

@Controller('impact')
@UseGuards(AuthGuard)
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @Get('overview')
  async getOverview(
    @Query() query: ImpactQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.impactService.getOverview(query, user);
  }

  @Get('trends')
  async getTrends(
    @Query() query: ImpactTrendsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.impactService.getTrends(query, user);
  }

  @Get('categories')
  async getCategories(
    @Query() query: ImpactQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.impactService.getCategoriesBreakdown(query, user);
  }

  @Get('definitions')
  async getDefinitions() {
    return this.impactService.getMetricDefinitions();
  }

  @Get('co2e/methodology')
  async getCo2eMethodology() {
    return this.impactService.getCo2eMethodology();
  }

  @Get('organisations/:organisationId')
  async getOrganisationImpact(
    @Param('organisationId', ParseUUIDPipe) organisationId: string,
    @Query() query: ImpactQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.impactService.getOrganisationImpact(organisationId, query, user);
  }

  @Get('report')
  async getDetailedReport(
    @Query() query: ImpactReportQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.impactService.getDetailedReport(query, user);
  }
}
