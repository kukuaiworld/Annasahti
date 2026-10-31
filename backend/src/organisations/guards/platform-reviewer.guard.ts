import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../auth/guards/supabase-auth.guard';

@Injectable()
export class PlatformReviewerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const claims = user.sessionClaims || {};
    const appMetadata = (claims['app_metadata'] as Record<string, unknown>) || {};
    const userMetadata = (claims['user_metadata'] as Record<string, unknown>) || {};

    const isPlatformAdmin =
      user.role === 'platform_admin' ||
      claims['is_platform_reviewer'] === true ||
      claims['role'] === 'platform_admin' ||
      claims['role'] === 'admin' ||
      appMetadata['is_platform_reviewer'] === true ||
      appMetadata['role'] === 'admin' ||
      appMetadata['role'] === 'platform_admin' ||
      userMetadata['is_platform_reviewer'] === true ||
      userMetadata['role'] === 'admin' ||
      userMetadata['role'] === 'platform_admin';

    if (!isPlatformAdmin) {
      throw new ForbiddenException(
        'Access denied: Platform reviewer or administrator privileges required. Organisation admin privileges do not grant platform reviewer access.',
      );
    }

    return true;
  }
}
