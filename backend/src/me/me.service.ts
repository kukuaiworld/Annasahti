import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AppRole } from '../common/enums/app.enums';

export interface MeResponse {
  id: string;
  email: string | null;
  fullName: string;
  role: AppRole | null;
  organisationId: string | null;
  organisationRole: AppRole | null;
  supabaseRole: string;
}

export interface MeOrganisationMembership {
  organisationId: string;
  organisationName: string;
  organisationType: string;
  membershipRole: AppRole;
  isActive: boolean;
  isVerified: boolean;
  joinedAt: string;
}

/**
 * Central "current user" APIs (Phase 0, Task A).
 *
 * Identity is the request-level context resolved by AuthGuard from the
 * cryptographically verified Supabase JWT and the trusted database profile
 * (AuthService.resolveUserContext). No client-controlled claim or header can
 * influence the values returned here.
 */
@Injectable()
export class MeService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * GET /api/v1/me
   * Returns the authenticated user's trusted backend identity.
   * Unprovisioned users (no database profile) are rejected upstream by the
   * AuthGuard with 403 "User profile not provisioned."
   */
  async getMe(user: AuthUser): Promise<MeResponse> {
    return {
      id: user.id,
      email: user.email ?? null,
      fullName: user.fullName,
      role: user.role ?? null,
      organisationId: user.organisationId ?? null,
      organisationRole: user.organisationRole ?? null,
      supabaseRole: user.supabaseRole ?? 'authenticated',
    };
  }

  /**
   * GET /api/v1/me/organisations
   * Returns every ACTIVE organisation membership of the authenticated user.
   * Inactive memberships are excluded at query level; other users' memberships
   * can never leak because the query is keyed on the verified caller id.
   * Stable ordering: joined_at ASC, organisation_id ASC.
   */
  async getMyOrganisations(user: AuthUser): Promise<{ data: MeOrganisationMembership[] }> {
    // Defensive: AuthGuard reject unprovisioned users before reaching here.
    if (!user.role) {
      return { data: [] };
    }

    const rows = await this.db.query<{
      organisation_id: string;
      organisation_name: string;
      organisation_type: string;
      membership_role: string;
      is_active: boolean;
      is_verified: boolean;
      joined_at: Date;
    }>(
      `
      SELECT
        m.organisation_id,
        o.name AS organisation_name,
        o.organisation_type,
        m.role AS membership_role,
        m.is_active,
        o.verification_status = 'verified'::public.verification_status AS is_verified,
        m.joined_at
      FROM public.organisation_members m
      JOIN public.organisations o ON o.id = m.organisation_id
      WHERE m.user_id = $1
        AND m.is_active = true
      ORDER BY m.joined_at ASC, m.organisation_id ASC;
      `,
      [user.id],
    );

    const data: MeOrganisationMembership[] = rows.map((row) => ({
      organisationId: row.organisation_id,
      organisationName: row.organisation_name,
      organisationType: row.organisation_type,
      membershipRole: row.membership_role as AppRole,
      isActive: Boolean(row.is_active),
      isVerified: Boolean(row.is_verified),
      joinedAt: new Date(row.joined_at).toISOString(),
    }));

    return { data };
  }
}
