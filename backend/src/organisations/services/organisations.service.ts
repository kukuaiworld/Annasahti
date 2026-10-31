import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IOrganisationRepository } from '../repositories/organisation.repository.interface';
import { CreateOrganisationDto } from '../dto/create-organisation.dto';
import { UpdateOrganisationDto } from '../dto/update-organisation.dto';
import { OperatingHoursDto } from '../dto/operating-hours.dto';
import {
  ReviewDecisionType,
  VerificationDecisionDto,
} from '../dto/verification-decision.dto';
import { Organisation } from '../entities/organisation.entity';
import { VerificationStatus } from '../enums/verification-status.enum';
import { AppRole } from '../enums/app-role.enum';

@Injectable()
export class OrganisationsService {
  constructor(
    @Inject('ORGANISATION_REPOSITORY')
    private readonly orgRepository: IOrganisationRepository,
  ) {}

  async createOrganisation(
    createDto: CreateOrganisationDto,
    creatorUserId: string,
  ): Promise<Organisation> {
    const existing = await this.orgRepository.findByName(createDto.name);
    if (existing) {
      throw new ConflictException(
        `An organisation with name "${createDto.name}" already exists`,
      );
    }

    const location =
      createDto.latitude !== undefined && createDto.longitude !== undefined
        ? { latitude: createDto.latitude, longitude: createDto.longitude }
        : undefined;

    const org = await this.orgRepository.createOrganisation({
      name: createDto.name,
      organisationType: createDto.organisationType,
      verificationStatus: VerificationStatus.PENDING,
      description: createDto.description,
      address: createDto.address,
      contactEmail: createDto.contactEmail,
      contactPhone: createDto.contactPhone,
      location,
      operatingHours: createDto.operatingHours || { timezone: 'UTC' },
    });

    // Automatically assign creator as administrator member
    await this.orgRepository.addMember({
      organisationId: org.id,
      userId: creatorUserId,
      role: AppRole.ADMIN,
      isActive: true,
    });

    return org;
  }

  async getOrganisationById(id: string): Promise<Organisation> {
    const org = await this.orgRepository.findById(id);
    if (!org) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }
    return org;
  }

  async getMyOrganisations(userId: string): Promise<Organisation[]> {
    return this.orgRepository.findByMemberUserId(userId);
  }

  async updateMyOrganisation(
    userId: string,
    updateDto: UpdateOrganisationDto,
  ): Promise<Organisation> {
    const userOrgs = await this.orgRepository.findByMemberUserId(userId);
    if (!userOrgs || userOrgs.length === 0) {
      throw new NotFoundException('No active organisation found for the authenticated user');
    }

    // Identify organisation where user is an admin
    let targetOrg: Organisation | undefined;
    for (const org of userOrgs) {
      const membership = await this.orgRepository.findMembership(org.id, userId);
      if (membership && membership.role === AppRole.ADMIN) {
        targetOrg = org;
        break;
      }
    }

    if (!targetOrg) {
      throw new ForbiddenException(
        'User is not an administrator of any associated organisation',
      );
    }

    const location =
      updateDto.latitude !== undefined && updateDto.longitude !== undefined
        ? { latitude: updateDto.latitude, longitude: updateDto.longitude }
        : targetOrg.location;

    return this.orgRepository.updateOrganisation(targetOrg.id, {
      ...(updateDto.name !== undefined && { name: updateDto.name }),
      ...(updateDto.organisationType !== undefined && {
        organisationType: updateDto.organisationType,
      }),
      ...(updateDto.description !== undefined && { description: updateDto.description }),
      ...(updateDto.address !== undefined && { address: updateDto.address }),
      ...(updateDto.contactEmail !== undefined && { contactEmail: updateDto.contactEmail }),
      ...(updateDto.contactPhone !== undefined && { contactPhone: updateDto.contactPhone }),
      location,
      ...(updateDto.operatingHours !== undefined && { operatingHours: updateDto.operatingHours }),
    });
  }

  async updateOperatingHours(
    id: string,
    hoursDto: OperatingHoursDto,
  ): Promise<Organisation> {
    const org = await this.getOrganisationById(id);
    return this.orgRepository.updateOrganisation(org.id, {
      operatingHours: hoursDto,
    });
  }

  async getPendingVerifications(): Promise<Organisation[]> {
    return this.orgRepository.findPendingVerification();
  }

  async applyVerificationDecision(
    id: string,
    decisionDto: VerificationDecisionDto,
    reviewerUserId: string,
  ): Promise<Organisation> {
    const org = await this.getOrganisationById(id);

    // Food safety & governance rule: Prevent self-approval by checking org membership
    const members = await this.orgRepository.findMembersByOrgId(id);
    const isMember = members.some((m) => m.userId === reviewerUserId && m.isActive);
    if (isMember) {
      throw new ForbiddenException(
        'Self-approval violation: Platform reviewers cannot make verification decisions for organisations they are members of.',
      );
    }

    const targetStatus =
      decisionDto.decision === ReviewDecisionType.VERIFIED
        ? VerificationStatus.VERIFIED
        : decisionDto.decision === ReviewDecisionType.REJECTED
        ? VerificationStatus.REJECTED
        : VerificationStatus.SUSPENDED;

    const now = new Date();
    return this.orgRepository.updateVerificationStatus(
      org.id,
      targetStatus,
      reviewerUserId,
      now,
    );
  }
}
