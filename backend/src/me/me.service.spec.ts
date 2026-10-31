import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { MeService } from './me.service';

describe('MeService (Phase 0, Task A)', () => {
  let service: MeService;
  let dbMock: jest.Mocked<Pick<DatabaseService, 'query' | 'queryOne'>>;

  const fullUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'donor@foodloop.org',
    fullName: 'Donor Dana',
    role: AppRole.DONOR,
    organisationId: '22222222-2222-2222-2222-222222222222',
    organisationRole: AppRole.DONOR,
    supabaseRole: 'authenticated',
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        // Real class token, as wired by DatabaseModule/AuthModule in production
        { provide: DatabaseService, useValue: dbMock as unknown as DatabaseService },
      ],
    }).compile();

    service = module.get<MeService>(MeService);
  });

  describe('getMe (/api/v1/me)', () => {
    it('returns the verified request-context identity in camelCase with explicit nulls', async () => {
      await expect(service.getMe(fullUser)).resolves.toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'donor@foodloop.org',
        fullName: 'Donor Dana',
        role: AppRole.DONOR,
        organisationId: '22222222-2222-2222-2222-222222222222',
        organisationRole: AppRole.DONOR,
        supabaseRole: 'authenticated',
      });
      // Identity comes from the request context: no database round-trip at all
      expect(dbMock.query).not.toHaveBeenCalled();
      expect(dbMock.queryOne).not.toHaveBeenCalled();
    });

    it('exposes role/org as null (never dropped keys) when optional parts are missing', async () => {
      const partiallyProvisioned: AuthUser = {
        id: '33333333-3333-3333-3333-333333333333',
        fullName: 'No Org Yet',
        role: AppRole.DONOR,
      };

      await expect(service.getMe(partiallyProvisioned)).resolves.toEqual({
        id: '33333333-3333-3333-3333-333333333333',
        email: null,
        fullName: 'No Org Yet',
        role: AppRole.DONOR,
        organisationId: null,
        organisationRole: null,
        supabaseRole: 'authenticated',
      });
    });

    it('does not trust client-supplied supabase claims for the response (falls back to authenticated)', async () => {
      await expect(
        service.getMe({ ...fullUser, supabaseRole: undefined }),
      ).resolves.toMatchObject({ supabaseRole: 'authenticated' });
    });
  });

  describe('getMyOrganisations (/api/v1/me/organisations)', () => {
    it('queries only the caller\u0027s ACTIVE memberships with stable ordering and maps to camelCase', async () => {
      dbMock.query.mockResolvedValueOnce([
        {
          organisation_id: 'org-a',
          organisation_name: 'Alpha Donors',
          organisation_type: 'restaurant',
          membership_role: AppRole.DONOR,
          is_active: true,
          is_verified: true,
          joined_at: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      const result = await service.getMyOrganisations(fullUser);

      expect(result.data).toEqual([
        expect.objectContaining({
          organisationId: 'org-a',
          organisationName: 'Alpha Donors',
          organisationType: 'restaurant',
          membershipRole: AppRole.DONOR,
          isActive: true,
          isVerified: true,
          joinedAt: '2026-01-01T00:00:00.000Z',
        }),
      ]);

      const sql = dbMock.query.mock.calls[0][0] as string;
      expect(sql).toContain('m.user_id = $1');
      expect(sql).toContain('m.is_active = true');
      expect(sql).toContain('ORDER BY m.joined_at ASC, m.organisation_id ASC');
      expect(dbMock.query).toHaveBeenCalledWith(sql, [fullUser.id]);
    });

    it('returns an empty list (no secondary membership query) for unprovisioned users', async () => {
      const unprovisioned: AuthUser = { id: '44444444-4444-4444-4444-444444444444', fullName: 'Unprovisioned' };

      const result = await service.getMyOrganisations(unprovisioned);

      expect(result).toEqual({ data: [] });
      expect(dbMock.query).not.toHaveBeenCalled();
    });
  });
});
