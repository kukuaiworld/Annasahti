import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JwtVerificationService } from './jwt-verification.service';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    JwtVerificationService,
    AuthService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthGuard,
  ],
  exports: [
    JwtVerificationService,
    AuthService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}
