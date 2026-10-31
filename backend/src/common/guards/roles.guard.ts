import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../enums/app.enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    if (!user.role) {
      throw new ForbiddenException('User profile not provisioned. Access denied.');
    }

    // 1. Platform administrator has access to all protected operations
    // Note: user.role is cryptographically derived and database-verified; never client-provided
    if (user.role === AppRole.ADMIN) {
      return true;
    }

    // 2. An endpoint explicitly requiring platform admin privileges can never be satisfied by
    // an organisation-scoped admin role or any non-platform admin role
    const requiresOnlyAdmin = requiredRoles.length === 1 && requiredRoles[0] === AppRole.ADMIN;
    if (requiresOnlyAdmin) {
      throw new ForbiddenException('Access denied. Platform administrator privileges required.');
    }

    // 3. Check whether user's verified platform application role satisfies requirements
    if (user.role && requiredRoles.includes(user.role)) {
      return true;
    }

    // 4. Organisation-scoped role check (strictly excluding platform-level administrator elevation)
    if (
      user.organisationRole &&
      user.organisationRole !== AppRole.ADMIN &&
      requiredRoles.includes(user.organisationRole)
    ) {
      return true;
    }

    throw new ForbiddenException(
      `Access denied. Requires one of the following roles: [${requiredRoles.join(', ')}]. Current role: ${user.role}.`,
    );
  }
}
