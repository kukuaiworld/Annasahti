import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PlatformReviewerGuard } from './platform-reviewer.guard';

describe('PlatformReviewerGuard', () => {
  let guard: PlatformReviewerGuard;

  beforeEach(() => {
    guard = new PlatformReviewerGuard();
  });

  function createMockExecutionContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if user has platform reviewer claim', () => {
    const context = createMockExecutionContext({
      id: 'platform-reviewer-id',
      role: 'authenticated',
      sessionClaims: {
        is_platform_reviewer: true,
      },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has platform_admin role', () => {
    const context = createMockExecutionContext({
      id: 'admin-id',
      role: 'platform_admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException if no user is present', () => {
    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('GOVERNANCE: should strictly deny access to ordinary users or org admins without platform reviewer claims', () => {
    const context = createMockExecutionContext({
      id: 'regular-org-admin-id',
      role: 'authenticated',
      sessionClaims: {
        // Only ordinary user claims, no platform claims
        email: 'orgadmin@restaurant.com',
      },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
