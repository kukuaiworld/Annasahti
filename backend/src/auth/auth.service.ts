import {
  Injectable,
  Logger,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { VerifiedJwtPayload } from './jwt-verification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Resolves trusted application context for a cryptographically verified JWT payload.
   * Enforces strict least-privilege: platform admin privileges can ONLY be granted if
   * explicitly recorded in public.profiles.role in the database.
   * Client-provided claims, user_metadata, or headers are NEVER trusted for privilege escalation.
   */
  async resolveUserContext(payload: VerifiedJwtPayload): Promise<AuthUser> {
    const userId = payload.sub;
    const email = payload.email;
    const supabaseRole = payload.role || 'authenticated';

    let fullName = email ? email.split('@')[0] : 'Authenticated User';
    let role: AppRole | undefined = undefined;
    let organisationId: string | undefined = undefined;
    let organisationRole: AppRole | undefined = undefined;
    let profile: { id: string; full_name?: string; role?: string } | null = null;
    try {
      profile = await this.db.queryOne<{ id: string; full_name: string; role: string }>(
        `SELECT id, full_name, role FROM public.profiles WHERE id = $1`,
        [userId],
      );
    } catch (err: any) {
      // Case C: Database unavailable - do not continue with synthetic DONOR identity
      this.logger.error(
        `Database query failed while resolving profile for user ${userId}: ${err.message}`,
        err.stack,
      );
      throw new ServiceUnavailableException('Authentication service temporarily unavailable.');
    }

    if (!profile) {
      // Case B: Missing database profile
      // Treat user as authenticated but unprovisioned (role is undefined).
      // Do not assign AppRole.DONOR.
      this.logger.warn(`User ${userId} authenticated via JWT but has no database profile (unprovisioned).`);
      return {
        id: userId,
        email,
        fullName,
        role: undefined,
        organisationId: undefined,
        organisationRole: undefined,
        supabaseRole,
      };
    }

    if (profile.full_name) {
      fullName = profile.full_name;
    }

    // Case D: Invalid or unknown stored application role
    // Strictly validate that profile role matches approved AppRole enum.
    // Do not silently downgrade to DONOR; fail closed and record safe diagnostic event.
    if (!profile.role || !Object.values(AppRole).includes(profile.role as AppRole)) {
      this.logger.error(
        `Security event: User ${userId} has invalid or unknown role "${profile.role}" in database profile. Failing closed.`,
      );
      throw new ForbiddenException('Access denied.');
    }

    role = profile.role as AppRole;

    try {
      // Phase 0 (Task A): deterministic, active-only organisation resolution.
      // - Inactive (suspended) memberships can never grant permissions.
      // - No schema-level primary organisation exists, so the policy is:
      //   "the oldest active membership joined by this user" (joined_at ASC,
      //   organisation_id tie-break). This is stable across requests instead
      //   of the previous arbitrary unordered `LIMIT 1`.
      // - All active memberships are exposed through GET /api/v1/me/organisations.
      const memberships = await this.db.query<{
        organisation_id: string;
        role: string | null;
        is_active: boolean;
        joined_at: Date;
      }>(
        `SELECT organisation_id, role, is_active, joined_at
         FROM public.organisation_members
         WHERE user_id = $1 AND is_active = true
         ORDER BY joined_at ASC, organisation_id ASC`,
        [userId],
      );

      const primaryMembership = memberships.length > 0 ? memberships[0] : null;

      if (primaryMembership) {
        organisationId = primaryMembership.organisation_id;
        const membershipRole = primaryMembership.role;
        if (membershipRole && Object.values(AppRole).includes(membershipRole as AppRole)) {
          organisationRole = membershipRole as AppRole;
        } else if (membershipRole) {
          this.logger.warn(
            `User ${userId} has unrecognized organisation role "${membershipRole}". Ignoring organisation role.`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Database query failed while resolving organisation membership for user ${userId}: ${err.message}`,
        err.stack,
      );
      throw new ServiceUnavailableException('Authentication service temporarily unavailable.');
    }

    return {
      id: userId,
      email,
      fullName,
      role,
      organisationId,
      organisationRole,
      supabaseRole,
    };
  }
}
