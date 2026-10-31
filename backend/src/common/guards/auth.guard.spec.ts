import {
  ExecutionContext,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { JwtVerificationService } from '../../auth/jwt-verification.service';
import { AuthService } from '../../auth/auth.service';
import { AppRole } from '../enums/app.enums';
import { AuthUser } from '../interfaces/auth-user.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_UNPROVISIONED_KEY } from '../decorators/allow-unprovisioned.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockJwtVerificationService: Partial<JwtVerificationService>;
  let mockAuthService: Partial<AuthService>;
  let mockReflector: Partial<Reflector>;

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const request = {
      headers: { ...headers },
      user: undefined,
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
    mockJwtVerificationService = {
      verifyToken: jest.fn(),
    };
    mockAuthService = {
      resolveUserContext: jest.fn(),
    };
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new AuthGuard(
      mockJwtVerificationService as JwtVerificationService,
      mockAuthService as AuthService,
      mockReflector as Reflector,
    );
  });

  describe('Public endpoint bypass (@Public)', () => {
    it('should allow access to public endpoints without any token or headers', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });
      const context = createMockContext();

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockJwtVerificationService.verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('Header-based authentication bypass prevention (SEC-01)', () => {
    it('should reject request when Authorization header is missing (401)', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request when x-user-id alone is provided (401)', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        'x-user-id': '00000000-0000-0000-0000-000000000001',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request when x-user-role: admin alone is provided (401)', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        'x-user-role': 'admin',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request when both x-user-id and x-user-role: admin are provided without Bearer token (401)', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        'x-user-id': '00000000-0000-0000-0000-000000000001',
        'x-user-role': 'admin',
        'x-organisation-id': '00000000-0000-0000-0000-000000000002',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should strictly ignore client identity headers even when a valid Bearer token is provided', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
        'x-user-id': 'spoofed-id',
        'x-user-role': 'admin',
        'x-organisation-id': 'spoofed-org',
      });

      const verifiedPayload = { sub: 'verified-user-uuid', role: 'authenticated' };
      const resolvedUser: AuthUser = {
        id: 'verified-user-uuid',
        fullName: 'Verified Donor',
        role: AppRole.DONOR, // Legitimate role, NOT spoofed admin
        supabaseRole: 'authenticated',
      };

      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockResolvedValue(resolvedUser);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);

      const req = context.switchToHttp().getRequest();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('verified-user-uuid');
      expect(req.user.id).not.toBe('spoofed-id');
      expect(req.user.role).toBe(AppRole.DONOR);
      expect(req.user.role).not.toBe(AppRole.ADMIN);
      expect(req.user.organisationId).toBeUndefined();
    });
  });

  describe('JWT token validation integration (SEC-02)', () => {
    it('should reject non-Bearer authorization header formats', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Basic dXNlcjpwYXNz',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject empty Bearer token', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer ',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate UnauthorizedException when JwtVerificationService rejects token', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer forged.or.expired.jwt',
      });

      (mockJwtVerificationService.verifyToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid or expired authentication token.'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully authenticate and populate request.user on valid token and profile', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const verifiedPayload = { sub: 'valid-uuid', email: 'user@foodloop.org' };
      const expectedUser: AuthUser = {
        id: 'valid-uuid',
        email: 'user@foodloop.org',
        fullName: 'Valid User',
        role: AppRole.DONOR,
      };

      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockResolvedValue(expectedUser);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);

      const req = context.switchToHttp().getRequest();
      expect(req.user).toEqual(expectedUser);
    });
  });

  describe('P0-3 Remediation: Missing profile, DB outage, and invalid role handling', () => {
    it('Case B: should reject unprovisioned user with HTTP 403 on protected operations', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_UNPROVISIONED_KEY) return false;
        return undefined;
      });
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const verifiedPayload = { sub: 'unprovisioned-uuid', email: 'new@foodloop.org' };
      const unprovisionedUser: AuthUser = {
        id: 'unprovisioned-uuid',
        email: 'new@foodloop.org',
        fullName: 'new',
        role: undefined, // No profile, unprovisioned
      };

      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockResolvedValue(unprovisionedUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('Case B: should allow unprovisioned user on dedicated onboarding endpoint with @AllowUnprovisioned', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ALLOW_UNPROVISIONED_KEY) return true;
        return undefined;
      });
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const verifiedPayload = { sub: 'unprovisioned-uuid', email: 'new@foodloop.org' };
      const unprovisionedUser: AuthUser = {
        id: 'unprovisioned-uuid',
        email: 'new@foodloop.org',
        fullName: 'new',
        role: undefined,
      };

      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockResolvedValue(unprovisionedUser);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.user.role).toBeUndefined();
    });

    it('Case C: should propagate HTTP 503 Service Unavailable when database is down', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const verifiedPayload = { sub: 'user-uuid' };
      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockRejectedValue(
        new ServiceUnavailableException('Authentication service temporarily unavailable.'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ServiceUnavailableException);
    });

    it('Case D: should fail closed (HTTP 403) when stored role in database is invalid', async () => {
      (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const verifiedPayload = { sub: 'invalid-role-uuid' };
      (mockJwtVerificationService.verifyToken as jest.Mock).mockResolvedValue(verifiedPayload);
      (mockAuthService.resolveUserContext as jest.Mock).mockRejectedValue(
        new ForbiddenException('Access denied.'),
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});
