import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AppRole } from '../enums/app.enums';
import { AuthUser } from '../interfaces/auth-user.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: Partial<Reflector>;

  const createMockContext = (user?: Partial<AuthUser>): ExecutionContext => {
    const request = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(mockReflector as Reflector);
  });

  it('should allow access if no roles are required on the route', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject when user context is missing on a role-protected route (403)', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.INSPECTOR]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject when user is unprovisioned (no role) on a role-protected route (403)', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.INSPECTOR]);
    const context = createMockContext({
      id: 'unprovisioned-uuid',
      role: undefined,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow platform administrator access to any role-protected route', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.INSPECTOR]);
    const context = createMockContext({
      id: 'admin-uuid',
      role: AppRole.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user platform role matches required role', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.INSPECTOR, AppRole.ADMIN]);
    const context = createMockContext({
      id: 'inspector-uuid',
      role: AppRole.INSPECTOR,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user role does not match required role', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.INSPECTOR]);
    const context = createMockContext({
      id: 'donor-uuid',
      role: AppRole.DONOR,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should NOT allow organisation-scoped admin role to access platform-admin-only endpoints', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.ADMIN]);
    const context = createMockContext({
      id: 'org-admin-uuid',
      role: AppRole.DONOR, // Platform role is donor
      organisationRole: AppRole.ADMIN, // Org-scoped role is admin
    });

    // Organisation admin must not be granted platform administrator privileges
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should never equate Supabase database role "authenticated" with platform admin', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([AppRole.ADMIN]);
    const context = createMockContext({
      id: 'regular-user-uuid',
      role: AppRole.DONOR,
      supabaseRole: 'authenticated',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
