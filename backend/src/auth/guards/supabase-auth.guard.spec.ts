import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    guard = new SupabaseAuthGuard(authService);
  });

  function createMockExecutionContext(headers: Record<string, string>): {
    context: ExecutionContext;
    request: Record<string, unknown>;
  } {
    const request: Record<string, unknown> = {
      headers,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  it('should reject requests missing Authorization header', async () => {
    const { context } = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is missing'),
    );
  });

  it('should reject requests with malformed Authorization header (no Bearer prefix)', async () => {
    const { context } = createMockExecutionContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Malformed Authorization header. Format must be: Bearer <token>',
      ),
    );
  });

  it('should reject requests with empty token after Bearer', async () => {
    const { context } = createMockExecutionContext({
      authorization: 'Bearer ',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Malformed Authorization header. Format must be: Bearer <token>',
      ),
    );
  });

  it('should allow valid token and attach authenticated user to request', async () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-uuid-1234',
      email: 'user@foodloop.org',
      role: 'authenticated',
    };

    authService.verifyToken.mockResolvedValueOnce(mockUser);

    const { context, request } = createMockExecutionContext({
      authorization: 'Bearer valid.jwt.token',
    });

    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
    expect(authService.verifyToken).toHaveBeenCalledWith('valid.jwt.token');
    expect(request.user).toEqual(mockUser);
  });
});
