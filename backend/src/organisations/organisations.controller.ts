import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { OrganisationsService } from './organisations.service';
import {
  AddOrganisationMemberDto,
  CreateOrganisationDto,
  RecipientRequirementsDto,
  UpdateOrganisationDto,
} from './dto/organisation.dto';

@Controller('organisations')
@UseGuards(AuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Post()
  async createOrganisation(
    @Body() dto: CreateOrganisationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.createOrganisation(dto, user);
  }

  @Get()
  async listOrganisations(@CurrentUser() user: AuthUser) {
    return this.organisationsService.listOrganisations(user);
  }

  @Get(':id')
  async getOrganisationById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.getOrganisationById(id, user);
  }

  @Patch(':id')
  async updateOrganisation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganisationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.updateOrganisation(id, dto, user);
  }

  /** Platform admin verification workflow (KYC) */
  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  async verifyOrganisation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.verifyOrganisation(id, 'verify', user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  async rejectOrganisation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.verifyOrganisation(id, 'reject', user);
  }

  @Post(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  async suspendOrganisation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.verifyOrganisation(id, 'suspend', user);
  }

  @Get(':id/members')
  async listMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.listMembers(id, user);
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddOrganisationMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.addMember(id, dto, user);
  }

  @Delete(':id/members/:memberUserId')
  @HttpCode(200)
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberUserId', ParseUUIDPipe) memberUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.removeMember(id, memberUserId, user);
  }

  /** NGO capacity / food acceptance requirements management */
  @Get(':id/requirements')
  getRecipientRequirements(@Param('id', ParseUUIDPipe) id: string) {
    return this.organisationsService.getRecipientRequirements(id);
  }

  @Post(':id/requirements')
  async upsertRecipientRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecipientRequirementsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.organisationsService.upsertRecipientRequirements(id, dto, user);
  }
}
