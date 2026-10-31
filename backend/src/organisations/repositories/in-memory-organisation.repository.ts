import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IOrganisationRepository } from './organisation.repository.interface';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationMember } from '../entities/organisation-member.entity';
import { RecipientRequirements } from '../entities/recipient-requirements.entity';
import { VerificationStatus } from '../enums/verification-status.enum';
import { AppRole } from '../enums/app-role.enum';
import { FoodCategory } from '../enums/food-category.enum';

@Injectable()
export class InMemoryOrganisationRepository implements IOrganisationRepository {
  private readonly organisations = new Map<string, Organisation>();
  private readonly members = new Map<string, OrganisationMember>();
  private readonly requirements = new Map<string, RecipientRequirements>();

  async createOrganisation(org: Partial<Organisation>): Promise<Organisation> {
    const id = org.id || randomUUID();
    const now = new Date();
    const entity: Organisation = {
      id,
      name: org.name!,
      organisationType: org.organisationType!,
      verificationStatus: org.verificationStatus || VerificationStatus.PENDING,
      description: org.description,
      address: org.address,
      location: org.location,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      operatingHours: org.operatingHours || { timezone: 'UTC' },
      verifiedAt: org.verifiedAt,
      verifiedBy: org.verifiedBy,
      createdAt: now,
      updatedAt: now,
    };
    this.organisations.set(id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<Organisation | null> {
    const org = this.organisations.get(id);
    return org ? { ...org } : null;
  }

  async findByName(name: string): Promise<Organisation | null> {
    const lowerName = name.trim().toLowerCase();
    for (const org of this.organisations.values()) {
      if (org.name.trim().toLowerCase() === lowerName) {
        return { ...org };
      }
    }
    return null;
  }

  async findByMemberUserId(userId: string): Promise<Organisation[]> {
    const orgIds = new Set<string>();
    for (const member of this.members.values()) {
      if (member.userId === userId && member.isActive) {
        orgIds.add(member.organisationId);
      }
    }

    const result: Organisation[] = [];
    for (const orgId of orgIds) {
      const org = this.organisations.get(orgId);
      if (org) {
        result.push({ ...org });
      }
    }
    return result;
  }

  async findPendingVerification(): Promise<Organisation[]> {
    const result: Organisation[] = [];
    for (const org of this.organisations.values()) {
      if (org.verificationStatus === VerificationStatus.PENDING) {
        result.push({ ...org });
      }
    }
    return result;
  }

  async updateOrganisation(
    id: string,
    updates: Partial<Organisation>,
  ): Promise<Organisation> {
    const org = this.organisations.get(id);
    if (!org) {
      throw new Error(`Organisation ${id} not found`);
    }

    const updated: Organisation = {
      ...org,
      ...updates,
      id: org.id, // Immutable
      updatedAt: new Date(),
    };
    this.organisations.set(id, updated);
    return { ...updated };
  }

  async updateVerificationStatus(
    id: string,
    status: VerificationStatus,
    verifiedBy: string,
    verifiedAt: Date,
  ): Promise<Organisation> {
    return this.updateOrganisation(id, {
      verificationStatus: status,
      verifiedBy,
      verifiedAt,
    });
  }

  async addMember(member: Partial<OrganisationMember>): Promise<OrganisationMember> {
    const id = member.id || randomUUID();
    const entity: OrganisationMember = {
      id,
      organisationId: member.organisationId!,
      userId: member.userId!,
      role: member.role || AppRole.ADMIN,
      isActive: member.isActive ?? true,
      joinedAt: new Date(),
    };
    this.members.set(id, entity);
    return { ...entity };
  }

  async findMembership(
    organisationId: string,
    userId: string,
  ): Promise<OrganisationMember | null> {
    for (const member of this.members.values()) {
      if (
        member.organisationId === organisationId &&
        member.userId === userId &&
        member.isActive
      ) {
        return { ...member };
      }
    }
    return null;
  }

  async findMembersByOrgId(organisationId: string): Promise<OrganisationMember[]> {
    const result: OrganisationMember[] = [];
    for (const member of this.members.values()) {
      if (member.organisationId === organisationId && member.isActive) {
        result.push({ ...member });
      }
    }
    return result;
  }

  async upsertRecipientRequirements(
    organisationId: string,
    req: Partial<RecipientRequirements>,
  ): Promise<RecipientRequirements> {
    let existingId: string | undefined;
    for (const [id, r] of this.requirements.entries()) {
      if (r.organisationId === organisationId) {
        existingId = id;
        break;
      }
    }

    const now = new Date();
    const id = existingId || randomUUID();
    const current = existingId ? this.requirements.get(existingId) : undefined;

    const entity: RecipientRequirements = {
      id,
      organisationId,
      acceptedCategories:
        req.acceptedCategories ||
        current?.acceptedCategories || [FoodCategory.HUMAN_CONSUMPTION],
      requestedQuantity:
        req.requestedQuantity !== undefined
          ? req.requestedQuantity
          : current?.requestedQuantity || 0,
      quantityUnit: req.quantityUnit || current?.quantityUnit || 'kg',
      storageCapacityKg:
        req.storageCapacityKg !== undefined
          ? req.storageCapacityKg
          : current?.storageCapacityKg,
      dietaryRequirements:
        req.dietaryRequirements !== undefined
          ? req.dietaryRequirements
          : current?.dietaryRequirements,
      speciesRequirements:
        req.speciesRequirements !== undefined
          ? req.speciesRequirements
          : current?.speciesRequirements,
      specialRequirements:
        req.specialRequirements !== undefined
          ? req.specialRequirements
          : current?.specialRequirements,
      isActive: req.isActive !== undefined ? req.isActive : current?.isActive ?? true,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    };

    this.requirements.set(id, entity);
    return { ...entity };
  }

  async findRecipientRequirements(
    organisationId: string,
  ): Promise<RecipientRequirements | null> {
    for (const req of this.requirements.values()) {
      if (req.organisationId === organisationId && req.isActive) {
        return { ...req };
      }
    }
    return null;
  }

  // Testing helper
  clear(): void {
    this.organisations.clear();
    this.members.clear();
    this.requirements.clear();
  }
}
