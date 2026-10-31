import { Organisation } from '../entities/organisation.entity';
import { OrganisationMember } from '../entities/organisation-member.entity';
import { RecipientRequirements } from '../entities/recipient-requirements.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

export interface IOrganisationRepository {
  createOrganisation(org: Partial<Organisation>): Promise<Organisation>;
  findById(id: string): Promise<Organisation | null>;
  findByName(name: string): Promise<Organisation | null>;
  findByMemberUserId(userId: string): Promise<Organisation[]>;
  findPendingVerification(): Promise<Organisation[]>;
  updateOrganisation(id: string, updates: Partial<Organisation>): Promise<Organisation>;
  updateVerificationStatus(
    id: string,
    status: VerificationStatus,
    verifiedBy: string,
    verifiedAt: Date,
  ): Promise<Organisation>;

  // Membership
  addMember(member: Partial<OrganisationMember>): Promise<OrganisationMember>;
  findMembership(organisationId: string, userId: string): Promise<OrganisationMember | null>;
  findMembersByOrgId(organisationId: string): Promise<OrganisationMember[]>;

  // Recipient Requirements
  upsertRecipientRequirements(
    organisationId: string,
    requirements: Partial<RecipientRequirements>,
  ): Promise<RecipientRequirements>;
  findRecipientRequirements(organisationId: string): Promise<RecipientRequirements | null>;
}

export const ORGANISATION_REPOSITORY = Symbol('IOrganisationRepository');
