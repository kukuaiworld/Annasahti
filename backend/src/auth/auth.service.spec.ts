import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { VerifiedJwtPayload } from './jwt-verification.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    mockDatabaseService = {
      queryOne: jest.fn(),
      query: jest.fn(),
      transaction: jest.fn(),
      getPool: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    // Real NestJS DI module compilation using the exact DatabaseService class token
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('NestJS Dependency Injection & Module Wiring (P0-2)', () => {
    it('should successfully resolve AuthService and inject DatabaseService via class token', () => {
      expect(service).toBeDefined();
      expect((service as any).db).toBeDefined();
      expect((service as any).db).toBe(mockDatabaseService);
    });

    it('should fail module compilation when required DatabaseService is not provided', async () => {
      // Proves DI fails at application startup rather than silently leaving DB unavailable
      await expect(
        Test.createTestingModule({
          providers: [AuthService],
        }).compile(),
      ).rejects.toThrow();
    });

    it('should actually invoke the database queries through the injected DatabaseService', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'invoke-test-uuid',
        email: 'invoke@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne
        .mockResolvedValueOnce({
          id: 'invoke-test-uuid',
          full_name: 'Invoke Tester',
          role: AppRole.DONOR,
        })
        .mockResolvedValueOnce(null); // unused legacy stub kept harmless

      // Only ACTIVE memberships are considered (Phase 0, Task A)
      mockDatabaseService.query.mockResolvedValueOnce([]);

      await service.resolveUserContext(payload);

      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, full_name, role FROM public.profiles WHERE id = $1'),
        ['invoke-test-uuid'],
      );
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = true'),
        ['invoke-test-uuid'],
      );
    });

    it('should distinguish a missing profile from a database query failure', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'distinguish-uuid',
        email: 'test@foodloop.org',
        role: 'authenticated',
      };

      // 1. Missing profile: returns unprovisioned context, does not throw 503
      mockDatabaseService.queryOne.mockResolvedValueOnce(null);
      const unprovisionedResult = await service.resolveUserContext(payload);
      expect(unprovisionedResult.role).toBeUndefined();
      expect(unprovisionedResult.id).toBe('distinguish-uuid');

      // 2. Database query failure: throws ServiceUnavailableException (503)
      mockDatabaseService.queryOne.mockRejectedValueOnce(new Error('Connection lost'));
      await expect(service.resolveUserContext(payload)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('Authorization & Profile Resolution (P0-3)', () => {
    it('Case A: should resolve platform role and organisation membership from valid database profile', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'user-uuid-1',
        email: 'inspector@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: 'user-uuid-1',
        full_name: 'Dr. Jane Food Inspector',
        role: AppRole.INSPECTOR,
      });
      mockDatabaseService.query.mockResolvedValueOnce([
        { organisation_id: 'org-uuid-1', role: AppRole.INSPECTOR, is_active: true, joined_at: new Date() },
      ]);

      const user = await service.resolveUserContext(payload);

      expect(user.id).toBe('user-uuid-1');
      expect(user.email).toBe('inspector@foodloop.org');
      expect(user.fullName).toBe('Dr. Jane Food Inspector');
      expect(user.role).toBe(AppRole.INSPECTOR);
      expect(user.organisationId).toBe('org-uuid-1');
      expect(user.organisationRole).toBe(AppRole.INSPECTOR);
      expect(user.supabaseRole).toBe('authenticated');
    });

    it('Case B: should treat user as unprovisioned (role undefined) and NOT assign DONOR when profile is missing', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'unprovisioned-uuid',
        email: 'unprovisioned@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce(null);

      const user = await service.resolveUserContext(payload);

      expect(user.id).toBe('unprovisioned-uuid');
      expect(user.role).toBeUndefined();
      expect(user.role).not.toBe(AppRole.DONOR);
      expect(user.fullName).toBe('unprovisioned');
      expect(user.organisationId).toBeUndefined();
      expect(user.organisationRole).toBeUndefined();
      expect(user.supabaseRole).toBe('authenticated');
    });

    it('Case C: should throw ServiceUnavailableException (503) when database query fails during profile lookup', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'db-down-user-uuid',
        email: 'down@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockRejectedValueOnce(new Error('Connection pool exhausted'));

      await expect(service.resolveUserContext(payload)).rejects.toThrow(ServiceUnavailableException);
    });

    it('Case C: should throw ServiceUnavailableException (503) when database query fails during membership lookup', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'db-down-user-uuid',
        email: 'down@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: 'db-down-user-uuid',
        full_name: 'Valid Profile',
        role: AppRole.DONOR,
      });
      // Membership lookup fails (Phase 0: membership is read via db.query)
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database timeout'));

      await expect(service.resolveUserContext(payload)).rejects.toThrow(ServiceUnavailableException);
    });

    it('Case D: should fail closed (ForbiddenException) when database role is invalid or unknown', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'invalid-role-user-uuid',
        email: 'invalid@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: 'invalid-role-user-uuid',
        full_name: 'Invalid Role User',
        role: 'unauthorized_superadmin',
      });

      await expect(service.resolveUserContext(payload)).rejects.toThrow(ForbiddenException);
    });

    it('Case E: should grant platform admin ONLY when explicitly recorded in public.profiles.role', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'admin-uuid',
        email: 'admin@foodloop.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: 'admin-uuid',
        full_name: 'Platform Admin',
        role: AppRole.ADMIN,
      });
      mockDatabaseService.query.mockResolvedValueOnce([]);

      const user = await service.resolveUserContext(payload);

      expect(user.id).toBe('admin-uuid');
      expect(user.role).toBe(AppRole.ADMIN);
    });

    it('Security: should never elevate to admin based on untrusted JWT claims or user_metadata', async () => {
      const payloadWithMaliciousClaim: VerifiedJwtPayload = {
        sub: 'hacker-uuid',
        email: 'attacker@evil.com',
        role: 'admin', // Untrusted claim attempt
        user_metadata: { role: 'admin', is_admin: true },
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce(null);

      const user = await service.resolveUserContext(payloadWithMaliciousClaim);

      // Must remain unprovisioned, NOT elevated to admin and NOT defaulted to donor
      expect(user.role).toBeUndefined();
      expect(user.role).not.toBe(AppRole.ADMIN);
      expect(user.role).not.toBe(AppRole.DONOR);
      expect(user.supabaseRole).toBe('admin');
    });

    it('Security: organisation-scoped admin must not grant platform admin role', async () => {
      const payload: VerifiedJwtPayload = {
        sub: 'org-admin-uuid',
        email: 'orgadmin@charity.org',
        role: 'authenticated',
      };

      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: 'org-admin-uuid',
        full_name: 'Charity Org Lead',
        role: AppRole.RECIPIENT, // Platform role is RECIPIENT
      });
      mockDatabaseService.query.mockResolvedValueOnce([
        {
          organisation_id: 'org-uuid-2',
          role: AppRole.ADMIN, // Org-scoped role is ADMIN
          is_active: true,
          joined_at: new Date(),
        },
      ]);

      const user = await service.resolveUserContext(payload);

      expect(user.role).toBe(AppRole.RECIPIENT);
      expect(user.role).not.toBe(AppRole.ADMIN);
      expect(user.organisationRole).toBe(AppRole.ADMIN);
    });
  });

  describe('Organisation membership resolution (Phase 0, Task A)', () => {
    const basePayload = (sub: string): VerifiedJwtPayload => ({
      sub,
      email: `${sub}@foodloop.org`,
      role: 'authenticated',
    });

    const stubProfile = (userId: string) => {
      mockDatabaseService.queryOne.mockResolvedValueOnce({
        id: userId,
        full_name: 'Membership Tester',
        role: AppRole.DONOR,
      });
    };

    it('resolves the single active membership into organisation context', async () => {
      stubProfile('member-1');
      mockDatabaseService.query.mockResolvedValueOnce([
        { organisation_id: 'org-1', role: AppRole.DONOR, is_active: true, joined_at: new Date('2026-01-01T00:00:00Z') },
      ]);

      const user = await service.resolveUserContext(basePayload('member-1'));

      expect(user.organisationId).toBe('org-1');
      expect(user.organisationRole).toBe(AppRole.DONOR);
    });

    it('uses the OLDEST active membership deterministically when several exist (no schema-level primary org)', async () => {
      stubProfile('member-2');
      // Query is expected to order by joined_at ASC, organisation_id ASC
      mockDatabaseService.query.mockResolvedValueOnce([
        { organisation_id: 'org-old', role: AppRole.DONOR, is_active: true, joined_at: new Date('2025-01-01T00:00:00Z') },
        { organisation_id: 'org-new', role: AppRole.RECIPIENT, is_active: true, joined_at: new Date('2026-06-01T00:00:00Z') },
      ]);

      const user = await service.resolveUserContext(basePayload('member-2'));

      expect(user.organisationId).toBe('org-old');
      expect(user.organisationRole).toBe(AppRole.DONOR);

      // Determinism comes from the SQL ordering, not from array coincidence
      const sql = mockDatabaseService.query.mock.calls[0][0] as string;
      expect(sql).toContain('ORDER BY joined_at ASC, organisation_id ASC');
      expect(sql).toContain('is_active = true');
    });

    it('excludes inactive (suspended) memberships: SQL filters is_active and no row means no org context', async () => {
      stubProfile('member-3');
      // The database (see SQL filter) never returns inactive memberships
      mockDatabaseService.query.mockResolvedValueOnce([]);

      const user = await service.resolveUserContext(basePayload('member-3'));

      expect(user.organisationId).toBeUndefined();
      expect(user.organisationRole).toBeUndefined();
      expect(user.role).toBe(AppRole.DONOR); // platform profile still applies

      const sql = mockDatabaseService.query.mock.calls[0][0] as string;
      expect(sql).toContain('is_active = true');
    });

    it('does not assign organisation context when the user has no memberships at all', async () => {
      stubProfile('member-4');
      mockDatabaseService.query.mockResolvedValueOnce([]);

      const user = await service.resolveUserContext(basePayload('member-4'));

      expect(user.organisationId).toBeUndefined();
      expect(user.organisationRole).toBeUndefined();
    });

    it('ignores membership rows whose role is not a valid AppRole (no silent elevation)', async () => {
      stubProfile('member-5');
      mockDatabaseService.query.mockResolvedValueOnce([
        { organisation_id: 'org-5', role: 'not_a_real_role', is_active: true, joined_at: new Date() },
      ]);

      const user = await service.resolveUserContext(basePayload('member-5'));

      expect(user.organisationId).toBe('org-5');
      expect(user.organisationRole).toBeUndefined();
    });
  });
});
