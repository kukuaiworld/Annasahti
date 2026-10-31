import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      status: 'ok',
      message: 'Authenticated user context verified',
      user,
    };
  }
}
