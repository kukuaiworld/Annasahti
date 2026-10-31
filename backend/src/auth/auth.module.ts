import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JwtVerificationService } from './jwt-verification.service';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    JwtVerificationService,
    AuthService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtVerificationService,
    AuthService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
