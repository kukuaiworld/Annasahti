import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DataReadinessService } from '../services/data-readiness.service';
import { WastePatternService } from '../services/waste-pattern.service';
import { SimulationOrchestratorService } from '../services/simulation-orchestrator.service';
import { OperationalIntelligenceService } from '../services/operational-intelligence.service';
import { SimulationRequestDto } from '../dto/simulation-request.dto';
import { EmergencyScenarioDto } from '../dto/emergency-scenario.dto';
import { CounterfactualRequestDto } from '../dto/counterfactual-request.dto';
import { OptimisationRequestDto } from '../dto/optimisation-request.dto';

@ApiTags('Advanced Intelligence Layer')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly readinessService: DataReadinessService,
    private readonly wastePatternService: WastePatternService,
    private readonly simulationService: SimulationOrchestratorService,
    private readonly operationalService: OperationalIntelligenceService,
  ) {}

  @Get('operational-summary')
  @ApiOperation({
    summary: 'Operational Intelligence: Measured Performance & Surplus Patterns',
    description:
      'Aggregates real-time delivery counts, rescue fulfillment rates, and surplus waste distributions from database telemetry.',
  })
  async getOperationalSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('organisationId') organisationId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.operationalService.getOperationalSummary(
      { startDate, endDate, organisationId },
      user as AuthUser,
    );
  }

  @Get('bottlenecks')
  @ApiOperation({
    summary: 'Operational Intelligence: Bottleneck & Lead-Time Analysis',
    description:
      'Detects inspection backlogs, delayed delivery pickups, and computes end-to-end operational lead times.',
  })
  async getBottlenecks(
    @Query('organisationId') organisationId?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.operationalService.getBottlenecks(user as AuthUser, organisationId);
  }

  @Get('readiness')
  @ApiOperation({
    summary: 'System Data Readiness & Maturity Assessment',
    description:
      'Evaluates operational data completeness, missing values, coordinate coverage, and readiness scores across all 6 intelligence capabilities.',
  })
  @ApiResponse({ status: 200, description: 'Readiness evaluation' })
  async getReadiness() {
    return this.readinessService.generateQualityReport();
  }

  @Get('quality-report')
  @ApiOperation({
    summary: 'Detailed Data Quality & Anomaly Report',
    description:
      'Audits datasets for missing fields, inconsistent units, timestamp mismatches, and unresolved discrepancies.',
  })
  @ApiResponse({ status: 200, description: 'Data quality audit' })
  async getQualityReport() {
    return this.readinessService.generateQualityReport();
  }

  @Get('waste-patterns')
  @ApiOperation({
    summary: 'Waste Pattern Detective: Descriptive Surplus Trends',
    description:
      'Detects recurring food waste patterns, peak weekday surplus, food category trends, and donation windows.',
  })
  @ApiQuery({ name: 'donorId', required: false, description: 'Filter by donor organisation UUID' })
  @ApiResponse({ status: 200, description: 'Waste pattern analysis' })
  async getWastePatterns(@Query('donorId') donorId?: string) {
    return this.wastePatternService.analyzeWastePatterns(donorId);
  }

  @Get('waste-forecasts')
  @ApiOperation({
    summary: 'Waste Pattern Detective: Surplus Forecasts',
    description:
      'Statistical moving-average surplus projections with confidence intervals, model methodology, and uncertainty indicators.',
  })
  @ApiQuery({ name: 'donorId', required: false })
  @ApiResponse({ status: 200, description: 'Surplus forecasts' })
  async getWasteForecasts(@Query('donorId') donorId?: string) {
    return this.wastePatternService.analyzeWastePatterns(donorId);
  }

  @Post('simulations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Digital Twin: Execute discrete-event simulation scenario',
    description:
      'Simulates operational network scenarios (surges, volunteer deficits, capacity bottlenecks). Output is strictly marked as simulated.',
  })
  @ApiResponse({ status: 201, description: 'Simulation output generated' })
  async runSimulation(@Body() dto: SimulationRequestDto) {
    return this.simulationService.runDigitalTwinSimulation(dto);
  }

  @Get('simulations/:id')
  @ApiOperation({
    summary: 'Digital Twin: Retrieve simulation results',
    description: 'Retrieves scenario projection metrics, comparison baselines, and bottlenecks.',
  })
  @ApiParam({ name: 'id', description: 'Simulation UUID' })
  @ApiResponse({ status: 200, description: 'Simulation result' })
  async getSimulation(@Param('id') id: string) {
    return this.simulationService.getSimulation(id);
  }

  @Post('emergency-scenarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emergency Resilience: Model disruption and reroute recommendations',
    description:
      'Generates alternative redistribution pathways respecting destination suitability and food safety. Requires human operator review.',
  })
  @ApiResponse({ status: 201, description: 'Emergency scenario generated' })
  async createEmergencyScenario(@Body() dto: EmergencyScenarioDto) {
    return this.simulationService.createEmergencyScenario(dto);
  }

  @Get('emergency-scenarios/:id')
  @ApiOperation({
    summary: 'Emergency Resilience: View scenario recommendations',
    description: 'Retrieves disruption rerouting recommendations and review approval status.',
  })
  @ApiParam({ name: 'id', description: 'Emergency scenario UUID' })
  @ApiResponse({ status: 200, description: 'Emergency scenario details' })
  async getEmergencyScenario(@Param('id') id: string) {
    return this.simulationService.getEmergencyScenario(id);
  }

  @Post('counterfactual-analysis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Counterfactual Impact: Model net additionality and avoided disposal',
    description:
      'Calculates net additional food rescue and CO2e savings without assuming 100% gross attribution. Includes uncertainty bounds.',
  })
  @ApiResponse({ status: 201, description: 'Counterfactual analysis completed' })
  async runCounterfactualAnalysis(@Body() dto: CounterfactualRequestDto) {
    return this.simulationService.runCounterfactualAnalysis(dto);
  }

  @Get('counterfactual-analysis/:id')
  @ApiOperation({
    summary: 'Counterfactual Impact: Retrieve analysis',
    description: 'Retrieves additionality estimates, baseline assumptions, and sensitivity analysis.',
  })
  @ApiParam({ name: 'id', description: 'Analysis UUID' })
  @ApiResponse({ status: 200, description: 'Counterfactual analysis result' })
  async getCounterfactualAnalysis(@Param('id') id: string) {
    return this.simulationService.getCounterfactualAnalysis(id);
  }

  @Post('optimisation-runs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Network Optimisation: Generate bipartite matching allocation plan',
    description:
      'Generates capacity-aware, distance-minimized matching recommendations explaining selection reasons.',
  })
  @ApiResponse({ status: 201, description: 'Optimisation plan generated' })
  async runOptimisation(@Body() dto: OptimisationRequestDto) {
    return this.simulationService.runNetworkOptimisation(dto);
  }

  @Get('optimisation-runs/:id')
  @ApiOperation({
    summary: 'Network Optimisation: Retrieve allocation plan',
    description: 'Retrieves recommended matches, distances, and capacity utilization.',
  })
  @ApiParam({ name: 'id', description: 'Optimisation plan UUID' })
  @ApiResponse({ status: 200, description: 'Optimisation plan details' })
  async getOptimisationPlan(@Param('id') id: string) {
    return this.simulationService.getOptimisationPlan(id);
  }
}
