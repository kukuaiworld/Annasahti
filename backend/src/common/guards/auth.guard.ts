import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtVerificationService } from '../../auth/jwt-verification.service';
import { AuthService } from '../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_UNPROVISIONED_KEY } from '../decorators/allow-unprovisioned.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtVerificationService: JwtVerificationService,
    private readonly authService: AuthService,
    @Optional() private readonly reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if endpoint is marked public via @Public()
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) {
        return true;
      }
    }

    const request = context.switchToHttp().getRequest();

    // 2. Extract Authorization Bearer token.
    // Client-provided identity headers (x-user-id, x-user-role, etc.) are strictly ignored.
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication token required.');
    }

    try {
      // 3. Cryptographically verify JWT signature, issuer, audience, and expiration
      const verifiedPayload = await this.jwtVerificationService.verifyToken(token);

      // 4. Resolve authenticated application context with strict least-privilege guarantees
      const user = await this.authService.resolveUserContext(verifiedPayload);

      // 5. Attach strongly typed, verified user context to request
      request.user = user;

      // 6. Enforce that unprovisioned users (missing profile) cannot access protected operations
      if (!user.role) {
        const allowUnprovisioned = this.reflector
          ? this.reflector.getAllAndOverride<boolean>(ALLOW_UNPROVISIONED_KEY, [
              context.getHandler(),
              context.getClass(),
            ])
          : false;

        if (!allowUnprovisioned) {
          throw new ForbiddenException('User profile not provisioned. Access denied.');
        }
      }

      return true;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(`Authentication failure: ${err.message}`);
      throw new UnauthorizedException('Authentication failed.');
    }
  }
}
