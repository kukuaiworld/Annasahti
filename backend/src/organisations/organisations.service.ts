import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import {
  AddOrganisationMemberDto,
  CreateOrganisationDto,
  RecipientRequirementsDto,
  UpdateOrganisationDto,
} from './dto/organisation.dto';

const ORG_SELECT_COLUMNS = `
  o.id, o.name, o.organisation_type, o.verification_status, o.description,
  o.address, o.contact_email, o.contact_phone, o.location,
  ST_Y(o.location::geometry) AS latitude, ST_X(o.location::geometry) AS longitude,
  o.operating_hours, o.verified_at, o.created_at, o.updated_at
`;

@Injectable()
export class OrganisationsService {
  constructor(private readonly db: DatabaseService) {}

  /** Platform admin check */
  private isPlatformAdmin(user: AuthUser): boolean {
    return user.role === AppRole.ADMIN;
  }

  /** Org-admin check: active 'admin' member of the given organisation */
  async isOrganisationAdmin(organisationId: string, userId: string): Promise<boolean> {
    const membership = await this.db.queryOne(
      `SELECT 1 AS is_admin
       FROM public.organisation_members
       WHERE organisation_id = $1 AND user_id = $2 AND role = 'admin' AND is_active = true
       LIMIT 1;`,
      [organisationId, userId],
    );
    return !!membership;
  }

  async isOrganisationMember(organisationId: string, userId: string): Promise<boolean> {
    const membership = await this.db.queryOne(
      `SELECT 1 AS is_member
       FROM public.organisation_members
       WHERE organisation_id = $1 AND user_id = $2 AND is_active = true
       LIMIT 1;`,
      [organisationId, userId],
    );
    return !!membership;
  }

  private buildLocation(geo?: [number, number]): string | null {
    if (geo && geo.length === 2 && Number.isFinite(geo[0]) && Number.isFinite(geo[1])) {
      // longitude ordering is validated by PostGIS (SRID 4326), value range enforced in SQL
      return `SRID=4326;POINT(${geo[0]} ${geo[1]})`;
    }
    return null;
  }

  private async requireOrgAdminOrPlatformAdmin(organisationId: string, user: AuthUser): Promise<void> {
    if (this.isPlatformAdmin(user)) return;
    const isAdmin = await this.isOrganisationAdmin(organisationId, user.id);
    if (!isAdmin) {
      throw new ForbiddenException('Only organisation admins or platform administrators can perform this action.');
    }
  }

  /**
   * POST /api/v1/organisations
   * Registers an organisation (starts in 'pending' verification) and assigns
   * the creator as its first organisation admin.
   */
  async createOrganisation(dto: CreateOrganisationDto, user: AuthUser): Promise<any> {
    const locationText = this.buildLocation(dto.location);
    if (locationText !== null) {
      const lng = (dto.location as [number, number])[0];
      const lat = (dto.location as [number, number])[1];
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new BadRequestException('Location must be [longitude, latitude] within valid WGS84 ranges.');
      }
    }

    if (user.organisationId) {
      throw new BadRequestException('You are already a member of an organisation and cannot create another one.');
    }

    return this.db.transaction(async (client) => {
      const columns: string[] = [
        'name', 'organisation_type', 'description', 'address',
        'contact_email', 'contact_phone', 'operating_hours',
      ];
      const valueExprs: string[] = ['$1', '$2', '$3', '$4', '$5', '$6', '$7::jsonb'];
      const values: any[] = [
        dto.name,
        dto.organisationType,
        dto.description || null,
        dto.address || null,
        dto.contactEmail || null,
        dto.contactPhone || null,
        JSON.stringify(dto.operatingHours || {}),
      ];

      if (locationText) {
        columns.push('location');
        valueExprs.push(`$${valueExprs.length + 1}::geography`);
        values.push(locationText);
      }

      const orgSql = `
        INSERT INTO public.organisations (${columns.join(', ')}, verification_status)
        VALUES (${valueExprs.join(', ')}, 'pending'::public.verification_status)
        RETURNING *;
      `;

      const org = (await client.query(orgSql, values)).rows[0];

      const membership = (
        await client.query(
          `
          INSERT INTO public.organisation_members (organisation_id, user_id, role, is_active)
          VALUES ($1, $2, 'admin'::public.app_role, true)
          RETURNING *;
          `,
          [org.id, user.id],
        )
      ).rows[0];

      return {
        message: 'Organisation registered successfully. Pending platform verification before it can receive or donate food.',
        organisation: org,
        membership,
      };
    }, user.id);
  }

  /** GET /api/v1/organisations - verified orgs are public to authenticated users */
  async listOrganisations(user: AuthUser): Promise<any> {
    const isAdmin = this.isPlatformAdmin(user);
    const org = (
      await this.db.query(
        `
        SELECT ${ORG_SELECT_COLUMNS}
        FROM public.organisations o
        WHERE o.verification_status = 'verified'::public.verification_status
          OR $1::boolean = true
          OR ($2::uuid IS NOT NULL AND o.id = $2::uuid)
        ORDER BY o.created_at DESC;
        `,
        [isAdmin, user.organisationId ?? null],
      )
    );
    return { data: org };
  }

  /** GET /api/v1/organisations/:id */
  async getOrganisationById(organisationId: string, user: AuthUser): Promise<any> {
    const org = await this.db.queryOne(
      `SELECT ${ORG_SELECT_COLUMNS} FROM public.organisations o WHERE o.id = $1;`,
      [organisationId],
    );

    if (!org) {
      throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
    }

    if (org.verification_status !== 'verified' && !this.isPlatformAdmin(user)) {
      const isMember = await this.isOrganisationMember(organisationId, user.id);
      if (!isMember) {
        throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
      }
    }

    return org;
  }

  /** PATCH /api/v1/organisations/:id - org admin or platform admin */
  async updateOrganisation(organisationId: string, dto: UpdateOrganisationDto, user: AuthUser): Promise<any> {
    await this.requireOrgAdminOrPlatformAdmin(organisationId, user);

    const org = await this.db.queryOne(`SELECT id FROM public.organisations WHERE id = $1;`, [organisationId]);
    if (!org) {
      throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
    }

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dto.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      sets.push(`description = $${idx++}`);
      values.push(dto.description);
    }
    if (dto.address !== undefined) {
      sets.push(`address = $${idx++}`);
      values.push(dto.address);
    }
    if (dto.contactEmail !== undefined) {
      sets.push(`contact_email = $${idx++}`);
      values.push(dto.contactEmail);
    }
    if (dto.contactPhone !== undefined) {
      sets.push(`contact_phone = $${idx++}`);
      values.push(dto.contactPhone);
    }
    if (dto.location !== undefined) {
      const locationText = this.buildLocation(dto.location);
      if (locationText !== null) {
        const lng = (dto.location as [number, number])[0];
        const lat = (dto.location as [number, number])[1];
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new BadRequestException('Location must be [longitude, latitude] within valid WGS84 ranges.');
        }
      }
      sets.push(`location = ${locationText ? `$${idx++}::geography` : 'NULL'}`);
      if (locationText) values.push(locationText);
    }
    if (dto.operatingHours !== undefined) {
      sets.push(`operating_hours = $${idx++}::jsonb`);
      values.push(JSON.stringify(dto.operatingHours));
    }

    if (sets.length === 0) {
      throw new BadRequestException('No updatable fields were provided.');
    }

    const updateSql = `
      UPDATE public.organisations
      SET ${sets.join(', ')}, updated_at = now()
      WHERE id = $${idx}
      RETURNING *;
    `;
    values.push(organisationId);

    return this.db.queryOne(updateSql, values);
  }

  /** POST /api/v1/organisations/:id/verify - platform admin only (RolesGuard) */
  async verifyOrganisation(organisationId: string, action: 'verify' | 'reject' | 'suspend', user: AuthUser): Promise<any> {
    const statusMap = {
      verify: 'verified',
      reject: 'rejected',
      suspend: 'suspended',
    } as const;

    const updated = (
      await this.db.queryOne(
        `
        UPDATE public.organisations
        SET verification_status = $1::public.verification_status,
            verified_at = CASE WHEN $1 = 'verified' THEN now() ELSE verified_at END,
            verified_by = $2,
            updated_at = now()
        WHERE id = $3
        RETURNING *;
        `,
        [statusMap[action], user.id, organisationId],
      )
    );

    if (!updated) {
      throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
    }

    return updated;
  }

  /** GET /api/v1/organisations/:id/members - members or platform admin */
  async listMembers(organisationId: string, user: AuthUser): Promise<any> {
    const isAdmin = this.isPlatformAdmin(user)
      || (await this.isOrganisationMember(organisationId, user.id));
    if (!isAdmin) {
      throw new ForbiddenException('Only organisation members or platform administrators can view the member list.');
    }

    const members = await this.db.query(
      `
      SELECT m.id, m.organisation_id, m.user_id, m.role, m.is_active, m.joined_at,
             p.full_name, p.avatar_url
      FROM public.organisation_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.organisation_id = $1
      ORDER BY m.joined_at ASC;
      `,
      [organisationId],
    );

    return { data: members };
  }

  /** POST /api/v1/organisations/:id/members - org admin or platform admin */
  async addMember(organisationId: string, dto: AddOrganisationMemberDto, user: AuthUser): Promise<any> {
    await this.requireOrgAdminOrPlatformAdmin(organisationId, user);

    if (dto.role === 'admin' && !this.isPlatformAdmin(user)) {
      throw new ForbiddenException('Only platform administrators can grant the organisation admin role.');
    }

    const profile = await this.db.queryOne(`SELECT id FROM public.profiles WHERE id = $1;`, [dto.userId]);
    if (!profile) {
      throw new NotFoundException(`User profile with ID "${dto.userId}" was not found.`);
    }

    const existing = await this.db.queryOne(
      `SELECT id, is_active FROM public.organisation_members WHERE organisation_id = $1 AND user_id = $2;`,
      [organisationId, dto.userId],
    );

    if (existing) {
      if (existing.is_active) {
        throw new BadRequestException('User is already an active member of this organisation.');
      }
      return this.db.queryOne(
        `UPDATE public.organisation_members SET is_active = true, role = $1::public.app_role WHERE id = $2 RETURNING *;`,
        [dto.role, existing.id],
      );
    }

    return this.db.queryOne(
      `
      INSERT INTO public.organisation_members (organisation_id, user_id, role, is_active)
      VALUES ($1, $2, $3::public.app_role, true)
      RETURNING *;
      `,
      [organisationId, dto.userId, dto.role],
    );
  }

  /** DELETE /api/v1/organisations/:id/members/:memberUserId */
  async removeMember(organisationId: string, memberUserId: string, user: AuthUser): Promise<any> {
    const platformAdmin = this.isPlatformAdmin(user);
    const orgAdmin = platformAdmin ? false : await this.isOrganisationAdmin(organisationId, user.id);
    const selfRemoval = user.id === memberUserId;

    if (!platformAdmin && !orgAdmin && !selfRemoval) {
      throw new ForbiddenException('Only organisation admins, platform administrators or the member themselves can remove a membership.');
    }

    if (orgAdmin && memberUserId === user.id) {
      // Prevent org admins from accidentally locking themselves out without an admin present
      const adminCount = await this.db.queryOne<{ count: number }>(
        `SELECT count(*)::int AS count FROM public.organisation_members
         WHERE organisation_id = $1 AND role = 'admin' AND is_active = true AND user_id <> $2;`,
        [organisationId, user.id],
      );
      if (!adminCount || adminCount.count < 1) {
        throw new BadRequestException('Cannot remove yourself: you are the last active admin of this organisation.');
      }
    }

    const existing = await this.db.queryOne(
      `SELECT id FROM public.organisation_members WHERE organisation_id = $1 AND user_id = $2 AND is_active = true;`,
      [organisationId, memberUserId],
    );

    if (!existing) {
      throw new NotFoundException('Active membership not found.');
    }

    await this.db.query(
      `UPDATE public.organisation_members SET is_active = false WHERE id = $1;`,
      [existing.id],
    );

    return { message: 'Membership removed.' };
  }

  /** GET /api/v1/organisations/:id/requirements */
  async getRecipientRequirements(organisationId: string): Promise<any> {
    const requirements = await this.db.query(
      `
      SELECT * FROM public.recipient_requirements
      WHERE organisation_id = $1 AND is_active = true
      ORDER BY created_at DESC;
      `,
      [organisationId],
    );
    return { data: requirements };
  }

  /** POST /api/v1/organisations/:id/requirements - upsert active requirements */
  async upsertRecipientRequirements(
    organisationId: string,
    dto: RecipientRequirementsDto,
    user: AuthUser,
  ): Promise<any> {
    const org = await this.db.queryOne(
      `SELECT id, organisation_type, verification_status FROM public.organisations WHERE id = $1;`,
      [organisationId],
    );
    if (!org) {
      throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
    }
    if (org.organisation_type !== 'animal_welfare_ngo' && org.organisation_type !== 'humanitarian_ngo'
        && org.organisation_type !== 'orphanage' && org.organisation_type !== 'government_school'
        && org.organisation_type !== 'old_age_home') {
      throw new BadRequestException('Only recipient organisations can manage food acceptance requirements.');
    }

    await this.requireOrgAdminOrPlatformAdmin(organisationId, user);

    return this.db.transaction(async (client) => {
      // Deactivate previous requirement rows (single active requirement per org)
      await client.query(
        `UPDATE public.recipient_requirements SET is_active = false WHERE organisation_id = $1 AND is_active = true;`,
        [organisationId],
      );

      const inserted = (
        await client.query(
          `
          INSERT INTO public.recipient_requirements (
            organisation_id, accepted_categories, requested_quantity,
            quantity_unit, storage_capacity_kg, special_requirements,
            supported_species, is_active
          )
          VALUES ($1, $2::public.food_category[], $3, $4, $5, $6, $7::public.animal_species[], true)
          RETURNING *;
          `,
          [
            organisationId,
            dto.acceptedCategories,
            dto.requestedQuantity,
            dto.quantityUnit,
            dto.storageCapacityKg ?? null,
            dto.specialRequirements || null,
            dto.supportedSpecies ?? null,
          ],
        )
      ).rows[0];

      return inserted;
    }, user.id);
  }
}
