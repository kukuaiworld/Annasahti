import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { MeOrganisationMembership, MeResponse, MeService } from './me.service';

/**
 * Central current-user endpoints (Phase 0, Task A).
 * Identity comes exclusively from the verified request user context;
 * unprovisioned users are rejected by AuthGuard before reaching these handlers.
 */
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.meService.getMe(user);
  }

  @Get('organisations')
  async getMyOrganisations(@CurrentUser() user: AuthUser): Promise<{ data: MeOrganisationMembership[] }> {
    return this.meService.getMyOrganisations(user);
  }
}
