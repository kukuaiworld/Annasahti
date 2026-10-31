import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { InMemoryOrganisationRepository } from '../repositories/in-memory-organisation.repository';
import { OrganisationType } from '../enums/organisation-type.enum';
import { VerificationStatus } from '../enums/verification-status.enum';
import { AppRole } from '../enums/app-role.enum';
import { ReviewDecisionType } from '../dto/verification-decision.dto';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let repo: InMemoryOrganisationRepository;

  const testUserId = 'user-0001-uuid';
  const reviewerUserId = 'reviewer-0001-uuid';

  beforeEach(() => {
    repo = new InMemoryOrganisationRepository();
    service = new OrganisationsService(repo);
  });

  describe('createOrganisation', () => {
    it('should create an organisation in PENDING status and assign creator as admin', async () => {
      const org = await service.createOrganisation(
        {
          name: 'Food For Hope',
          organisationType: OrganisationType.HUMANITARIAN_NGO,
          description: 'Distributing meals',
          address: '42 Main St',
          contactEmail: 'info@hope.org',
          latitude: 12.9716,
          longitude: 77.5946,
        },
        testUserId,
      );

      expect(org.id).toBeDefined();
      expect(org.name).toBe('Food For Hope');
      expect(org.verificationStatus).toBe(VerificationStatus.PENDING);
      expect(org.location).toEqual({ latitude: 12.9716, longitude: 77.5946 });

      const members = await repo.findMembersByOrgId(org.id);
      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(testUserId);
      expect(members[0].role).toBe(AppRole.ADMIN);
      expect(members[0].isActive).toBe(true);
    });

    it('should reject duplicate organisation names with ConflictException', async () => {
      await service.createOrganisation(
        {
          name: 'Unique Charity',
          organisationType: OrganisationType.HUMANITARIAN_NGO,
        },
        testUserId,
      );

      await expect(
        service.createOrganisation(
          {
            name: 'Unique Charity',
            organisationType: OrganisationType.HUMANITARIAN_NGO,
          },
          'another-user',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getOrganisationById', () => {
    it('should return organisation when found', async () => {
      const created = await service.createOrganisation(
        { name: 'City Shelter', organisationType: OrganisationType.ORPHANAGE },
        testUserId,
      );

      const found = await service.getOrganisationById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('City Shelter');
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.getOrganisationById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMyOrganisation', () => {
    it('should update organisation details when user is admin', async () => {
      const created = await service.createOrganisation(
        { name: 'Old Name', organisationType: OrganisationType.RESTAURANT },
        testUserId,
      );

      const updated = await service.updateMyOrganisation(testUserId, {
        name: 'New Name',
        description: 'Updated description',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should throw NotFoundException if user has no organisation', async () => {
      await expect(
        service.updateMyOrganisation('stranger-user', { name: 'Something' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyVerificationDecision and Self-Approval Prevention', () => {
    it('should allow platform reviewer to verify organisation', async () => {
      const created = await service.createOrganisation(
        { name: 'Animal Haven', organisationType: OrganisationType.ANIMAL_WELFARE_NGO },
        testUserId,
      );

      const verified = await service.applyVerificationDecision(
        created.id,
        { decision: ReviewDecisionType.VERIFIED, notes: 'All docs verified' },
        reviewerUserId,
      );

      expect(verified.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(verified.verifiedBy).toBe(reviewerUserId);
      expect(verified.verifiedAt).toBeDefined();
    });

    it('should allow platform reviewer to reject organisation with reason', async () => {
      const created = await service.createOrganisation(
        { name: 'Shady Kitchen', organisationType: OrganisationType.RESTAURANT },
        testUserId,
      );

      const rejected = await service.applyVerificationDecision(
        created.id,
        {
          decision: ReviewDecisionType.REJECTED,
          rejectionReason: 'Invalid hygiene certificate',
        },
        reviewerUserId,
      );

      expect(rejected.verificationStatus).toBe(VerificationStatus.REJECTED);
      expect(rejected.verifiedBy).toBe(reviewerUserId);
    });

    it('FOOD SAFETY & GOVERNANCE: should STRICTLY prevent reviewer self-approval if reviewer is a member', async () => {
      // Creator is testUserId
      const created = await service.createOrganisation(
        { name: 'Self Approved Org', organisationType: OrganisationType.RESTAURANT },
        testUserId,
      );

      // Attempting to review own organisation
      await expect(
        service.applyVerificationDecision(
          created.id,
          { decision: ReviewDecisionType.VERIFIED },
          testUserId, // SAME USER AS CREATOR/MEMBER!
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
