import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import { OrgAdminGuard } from '../guards/org-admin.guard';
import { OrganisationsService } from '../services/organisations.service';
import { RecipientRequirementsService } from '../services/recipient-requirements.service';
import { CreateOrganisationDto } from '../dto/create-organisation.dto';
import { UpdateOrganisationDto } from '../dto/update-organisation.dto';
import { OperatingHoursDto } from '../dto/operating-hours.dto';
import { RecipientCapacityDto } from '../dto/recipient-capacity.dto';
import { FoodAcceptanceDto } from '../dto/food-acceptance.dto';
import { UpdateRecipientRequirementsDto } from '../dto/recipient-requirements.dto';

@ApiTags('Organisations')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('organisations')
export class OrganisationsController {
  constructor(
    private readonly orgService: OrganisationsService,
    private readonly recipientService: RecipientRequirementsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new organisation',
    description:
      'Creates a new organisation in PENDING verification status and establishes the caller as the administrator.',
  })
  @ApiResponse({ status: 201, description: 'Organisation successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid payload or validation failed' })
  @ApiResponse({ status: 409, description: 'Organisation with this name already exists' })
  async create(
    @Body() createDto: CreateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orgService.createOrganisation(createDto, user.id);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user organisations',
    description: 'Retrieves all organisations associated with the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'List of associated organisations' })
  async getMyOrganisations(@CurrentUser() user: AuthenticatedUser) {
    return this.orgService.getMyOrganisations(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user administered organisation profile',
    description:
      'Updates basic profile details of the organisation where the caller holds administrator status.',
  })
  @ApiResponse({ status: 200, description: 'Organisation successfully updated' })
  @ApiResponse({ status: 403, description: 'User does not administer an organisation' })
  @ApiResponse({ status: 404, description: 'No administered organisation found' })
  async updateMyOrganisation(
    @Body() updateDto: UpdateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orgService.updateMyOrganisation(user.id, updateDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get organisation profile by ID',
    description: 'Retrieves organisation public profile details by ID.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Organisation details' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async getById(@Param('id') id: string) {
    return this.orgService.getOrganisationById(id);
  }

  @Put(':id/operating-hours')
  @UseGuards(OrgAdminGuard)
  @ApiOperation({
    summary: 'Update organisation operating hours',
    description:
      'Configures operational shifts, opening/closing times, and time zone for donation/delivery scheduling.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Operating hours updated' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async updateOperatingHours(
    @Param('id') id: string,
    @Body() hoursDto: OperatingHoursDto,
  ) {
    return this.orgService.updateOperatingHours(id, hoursDto);
  }

  @Get(':id/recipient-requirements')
  @ApiOperation({
    summary: 'Get recipient requirements and capacity',
    description: 'Fetches configured recipient intake capacity, food acceptance, and dietary constraints.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Configured requirements' })
  @ApiResponse({ status: 404, description: 'Requirements or organisation not found' })
  async getRecipientRequirements(@Param('id') id: string) {
    return this.recipientService.getRequirements(id);
  }

  @Put(':id/capacity')
  @UseGuards(OrgAdminGuard)
  @ApiOperation({
    summary: 'Update recipient organisation capacity',
    description:
      'Configures maximum storage capacity (kg) and requested quantity per distribution cycle with explicit units.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Capacity configured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid capacity or quantity units' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async updateCapacity(
    @Param('id') id: string,
    @Body() capacityDto: RecipientCapacityDto,
  ) {
    return this.recipientService.updateCapacity(id, capacityDto);
  }

  @Put(':id/food-acceptance')
  @UseGuards(OrgAdminGuard)
  @ApiOperation({
    summary: 'Update recipient food category acceptance',
    description:
      'Sets accepted food categories (human_consumption, animal_appropriate, organic_waste). Animal food acceptance requires prior species configuration.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Accepted categories updated successfully' })
  @ApiResponse({ status: 400, description: 'Food safety violation or empty category array' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async updateFoodAcceptance(
    @Param('id') id: string,
    @Body() acceptanceDto: FoodAcceptanceDto,
  ) {
    return this.recipientService.updateFoodAcceptance(id, acceptanceDto);
  }

  @Put(':id/recipient-requirements')
  @UseGuards(OrgAdminGuard)
  @ApiOperation({
    summary: 'Update recipient full requirements with dietary and species rules',
    description:
      'Configures intake quota, storage capacity, human dietary rules (vegetarian, allergens, halal/kosher), and species-specific animal requirements.',
  })
  @ApiParam({ name: 'id', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'Requirements updated successfully' })
  @ApiResponse({ status: 400, description: 'Food safety violation or invalid parameters' })
  @ApiResponse({ status: 403, description: 'User is not an admin of this organisation' })
  async updateRecipientRequirements(
    @Param('id') id: string,
    @Body() requirementsDto: UpdateRecipientRequirementsDto,
  ) {
    return this.recipientService.updateAllRequirements(id, requirementsDto);
  }
}
