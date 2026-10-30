import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RecognitionService } from './recognition.service';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';

describe('RecognitionService', () => {
  let service: RecognitionService;
  let dbMock: any;

  const mockAdminUser: AuthUser = {
    id: 'admin-uuid',
    fullName: 'Platform Admin',
    role: AppRole.ADMIN,
  };

  const mockVolunteerUser: AuthUser = {
    id: 'vol-uuid-1',
    fullName: 'Sarah Jenkins',
    role: AppRole.VOLUNTEER,
  };

  const mockOtherUser: AuthUser = {
    id: 'vol-uuid-2',
    fullName: 'Marco Rossi',
    role: AppRole.VOLUNTEER,
  };

  beforeEach(async () => {
    dbMock = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecognitionService,
        { provide: DatabaseService, useValue: dbMock },
      ],
    }).compile();

    service = module.get<RecognitionService>(RecognitionService);
  });

  describe('getVolunteerProfile', () => {
    const mockProfileRow = {
      id: 'vol-uuid-1',
      full_name: 'Sarah Jenkins',
      role: 'volunteer',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Passionate about stopping food waste',
      privacy_settings: {
        showFullNameOnLeaderboard: true,
        showMetricsPublicly: true,
      },
      created_at: new Date('2026-01-01'),
    };

    it('should return complete volunteer profile with verified stats and counts for the user', async () => {
      // 1. profile lookup
      // 2. evaluate stats query (in evaluateAndAwardAchievements)
      // 3. evaluate defs query (in evaluateAndAwardAchievements)
      // 4. completed stats query
      // 5. active stats query
      // 6. badge & cert counts query
      dbMock.queryOne
        .mockResolvedValueOnce(mockProfileRow) // profile
        .mockResolvedValueOnce({ completed_count: 12, total_kg: '150.0' }) // evaluate stats
        .mockResolvedValueOnce({
          completed_deliveries: 12,
          total_food_rescued_kg: '150.0',
          volunteer_hours: '14.5',
        }) // completed stats
        .mockResolvedValueOnce({ active_deliveries: 1 }) // active stats
        .mockResolvedValueOnce({ badges_count: 2, certificates_count: 1 }); // counts

      dbMock.query.mockResolvedValueOnce([]); // defs in evaluate

      const res = await service.getVolunteerProfile('vol-uuid-1', mockVolunteerUser);

      expect(res.id).toBe('vol-uuid-1');
      expect(res.fullName).toBe('Sarah Jenkins');
      expect(res.stats.completedDeliveries).toBe(12);
      expect(res.stats.totalFoodRescuedKg).toBe(150);
      expect(res.stats.volunteerHours).toBe(14.5);
      expect(res.stats.activeDeliveries).toBe(1);
      expect(res.earnedBadgesCount).toBe(2);
      expect(res.certificatesCount).toBe(1);
    });

    it('should mask full name and metrics if privacy is requested and viewer is another volunteer', async () => {
      const privateProfile = {
        ...mockProfileRow,
        privacy_settings: {
          showFullNameOnLeaderboard: false,
          showMetricsPublicly: false,
        },
      };

      dbMock.queryOne
        .mockResolvedValueOnce(privateProfile)
        .mockResolvedValueOnce({ completed_count: 12, total_kg: '150.0' })
        .mockResolvedValueOnce({
          completed_deliveries: 12,
          total_food_rescued_kg: '150.0',
          volunteer_hours: '14.5',
        })
        .mockResolvedValueOnce({ active_deliveries: 1 })
        .mockResolvedValueOnce({ badges_count: 2, certificates_count: 1 });

      dbMock.query.mockResolvedValueOnce([]);

      const res = await service.getVolunteerProfile('vol-uuid-1', mockOtherUser);

      // Masked display name: Sarah Jenkins -> Sarah J.
      expect(res.fullName).toBe('Sarah J.');
      // Metrics hidden
      expect(res.stats.completedDeliveries).toBe(0);
      expect(res.stats.totalFoodRescuedKg).toBe(0);
    });
  });

  describe('updateVolunteerProfile', () => {
    it('should update permitted volunteer profile fields', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'vol-uuid-1',
        full_name: 'Sarah Jenkins',
        bio: 'Updated bio',
        avatar_url: 'https://cdn.example.com/new-avatar.jpg',
      });

      const res = await service.updateVolunteerProfile(
        { bio: 'Updated bio', avatarUrl: 'https://cdn.example.com/new-avatar.jpg' },
        mockVolunteerUser,
      );

      expect(res.profile.bio).toBe('Updated bio');
      expect(dbMock.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.profiles'),
        expect.arrayContaining(['https://cdn.example.com/new-avatar.jpg', 'Updated bio']),
      );
    });
  });

  describe('evaluateAndAwardAchievements', () => {
    it('should automatically award achievements when delivery threshold is met', async () => {
      // 12 deliveries, 120 kg
      dbMock.queryOne.mockResolvedValueOnce({
        completed_count: 12,
        total_kg: '120.0',
      });

      dbMock.query.mockResolvedValueOnce([
        {
          achievement_code: 'FIRST_DELIVERY',
          threshold_type: 'delivery_count',
          threshold_value: 1,
          title: 'First Rescue',
          description: 'Completed 1st delivery',
        },
        {
          achievement_code: 'DELIVERIES_10',
          threshold_type: 'delivery_count',
          threshold_value: 10,
          title: 'Bronze Rescuer',
          description: 'Completed 10 deliveries',
        },
        {
          achievement_code: 'DELIVERIES_50',
          threshold_type: 'delivery_count',
          threshold_value: 50,
          title: 'Silver Rescuer',
          description: 'Completed 50 deliveries',
        },
      ]);

      await service.evaluateAndAwardAchievements('vol-uuid-1');

      // FIRST_DELIVERY and DELIVERIES_10 should be awarded (insert query called)
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.volunteer_achievements'),
        expect.arrayContaining(['vol-uuid-1', 'FIRST_DELIVERY']),
      );
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.volunteer_achievements'),
        expect.arrayContaining(['vol-uuid-1', 'DELIVERIES_10']),
      );
    });
  });

  describe('getBadges', () => {
    it('should return badges with progress percentage and unlocked state', async () => {
      // evaluate query stats
      dbMock.queryOne
        .mockResolvedValueOnce({ completed_count: 5, total_kg: '50.0' }) // for evaluate
        .mockResolvedValueOnce({ completed_count: 5, total_kg: '50.0' }); // for badge calculations

      // evaluate defs
      dbMock.query
        .mockResolvedValueOnce([]) // evaluate defs
        .mockResolvedValueOnce([
          {
            achievement_code: 'FIRST_DELIVERY',
            title: 'First Rescue',
            description: '1 delivery',
            badge_icon: 'badge-1',
            category: 'delivery_milestone',
            threshold_type: 'delivery_count',
            threshold_value: 1,
          },
          {
            achievement_code: 'DELIVERIES_10',
            title: 'Bronze Rescuer',
            description: '10 deliveries',
            badge_icon: 'badge-10',
            category: 'delivery_milestone',
            threshold_type: 'delivery_count',
            threshold_value: 10,
          },
        ]) // defs query
        .mockResolvedValueOnce([
          {
            achievement_code: 'FIRST_DELIVERY',
            awarded_at: new Date('2026-02-01'),
          },
        ]); // earned achievements query

      const badges = await service.getBadges('vol-uuid-1', mockVolunteerUser);

      expect(badges.length).toBe(2);

      // FIRST_DELIVERY: unlocked (100%)
      expect(badges[0].achievementCode).toBe('FIRST_DELIVERY');
      expect(badges[0].isUnlocked).toBe(true);
      expect(badges[0].percentage).toBe(100);

      // DELIVERIES_10: locked (5 out of 10 = 50%)
      expect(badges[1].achievementCode).toBe('DELIVERIES_10');
      expect(badges[1].isUnlocked).toBe(false);
      expect(badges[1].currentValue).toBe(5);
      expect(badges[1].percentage).toBe(50);
    });
  });

  describe('issueCertificate and verifyCertificatePublic', () => {
    it('should issue certificate when qualifying achievement is verified', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({ id: 'ach-1', achievement_code: 'DELIVERIES_10' }) // verify achievement
        .mockResolvedValueOnce({
          id: 'cert-1',
          volunteer_id: 'vol-uuid-1',
          certificate_code: 'FL-CERT-2026-ABCD1234',
          certificate_type: 'SERVICE_MILESTONE',
          title: 'Bronze Rescuer Certificate',
          issued_at: new Date(),
        }); // insert certificate

      const cert = await service.issueCertificate(
        {
          certificateType: 'SERVICE_MILESTONE',
          title: 'Bronze Rescuer Certificate',
          achievementCode: 'DELIVERIES_10',
        },
        mockVolunteerUser,
      );

      expect(cert.certificateCode).toContain('FL-CERT-2026-');
      expect(cert.isRevoked).toBe(false);
    });

    it('should reject certificate issuance if volunteer has not earned the qualifying achievement', async () => {
      dbMock.queryOne.mockResolvedValueOnce(null); // achievement not found

      await expect(
        service.issueCertificate(
          {
            certificateType: 'SERVICE_MILESTONE',
            title: 'Gold Rescuer Certificate',
            achievementCode: 'DELIVERIES_100',
          },
          mockVolunteerUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify an authentic certificate publicly with masked recipient name', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'cert-1',
        certificate_code: 'FL-CERT-2026-ABCD1234',
        certificate_type: 'SERVICE_MILESTONE',
        title: 'Bronze Rescuer Certificate',
        recipient_name: 'Sarah Jenkins',
        issued_at: new Date('2026-03-01'),
        is_revoked: false,
      });

      const res = await service.verifyCertificatePublic('FL-CERT-2026-ABCD1234');

      expect(res.isValid).toBe(true);
      expect(res.status).toBe('valid');
      expect(res.recipientName).toBe('Sarah J.');
    });

    it('should return revoked status if certificate has been revoked', async () => {
      dbMock.queryOne.mockResolvedValueOnce({
        id: 'cert-1',
        certificate_code: 'FL-CERT-2026-REVOKED',
        recipient_name: 'Sarah Jenkins',
        issued_at: new Date('2026-03-01'),
        is_revoked: true,
        revocation_reason: 'Administrative correction',
      });

      const res = await service.verifyCertificatePublic('FL-CERT-2026-REVOKED');

      expect(res.isValid).toBe(false);
      expect(res.status).toBe('revoked');
      expect(res.revocationReason).toBe('Administrative correction');
    });
  });

  describe('getLeaderboard', () => {
    it('should return ranked leaderboard entries with masked names where privacy is requested', async () => {
      dbMock.queryOne.mockResolvedValueOnce({ total: 2 }); // count query

      dbMock.query.mockResolvedValueOnce([
        {
          volunteer_id: 'vol-1',
          full_name: 'Sarah Jenkins',
          privacy_settings: { showFullNameOnLeaderboard: true },
          completed_deliveries: 20,
          total_food_rescued_kg: 250,
          volunteer_hours: 22.0,
        },
        {
          volunteer_id: 'vol-2',
          full_name: 'Marco Rossi',
          privacy_settings: { showFullNameOnLeaderboard: false }, // Private name!
          completed_deliveries: 15,
          total_food_rescued_kg: 180,
          volunteer_hours: 18.0,
        },
      ]);

      const res = await service.getLeaderboard({ period: 'all_time', metric: 'deliveries' });

      expect(res.entries.length).toBe(2);
      expect(res.entries[0].rank).toBe(1);
      expect(res.entries[0].displayName).toBe('Sarah Jenkins');
      expect(res.entries[1].rank).toBe(2);
      expect(res.entries[1].displayName).toBe('Marco R.'); // Masked!
    });
  });

  describe('nominateVolunteerOfTheMonth', () => {
    it('should allow admin to nominate volunteer and snapshot monthly performance', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({ id: 'vol-1', full_name: 'Sarah Jenkins' }) // volunteer check
        .mockResolvedValueOnce({ count: 18, kg: '220.0' }) // metrics snapshot
        .mockResolvedValueOnce({
          id: 'votm-1',
          recognition_period: '2026-10',
          volunteer_id: 'vol-1',
          selection_notes: 'Outstanding weekend rescue support',
          awarded_at: new Date(),
        }); // insert

      const res = await service.nominateVolunteerOfTheMonth(
        {
          recognitionPeriod: '2026-10',
          volunteerId: 'vol-1',
          selectionNotes: 'Outstanding weekend rescue support',
        },
        mockAdminUser,
      );

      expect(res.recognitionPeriod).toBe('2026-10');
      expect(res.metricsSnapshot.deliveriesCount).toBe(18);
      expect(res.metricsSnapshot.rescuedKg).toBe(220);
    });

    it('should forbid non-admin users from nominating volunteer of the month', async () => {
      await expect(
        service.nominateVolunteerOfTheMonth(
          {
            recognitionPeriod: '2026-10',
            volunteerId: 'vol-1',
            selectionNotes: 'Unauthorized nomination',
          },
          mockVolunteerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate nominations for the same recognition period', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({ id: 'vol-1', full_name: 'Sarah Jenkins' })
        .mockResolvedValueOnce({ count: 10, kg: '100.0' })
        .mockRejectedValueOnce(new Error('volunteer_of_the_month_recognition_period_key'));

      await expect(
        service.nominateVolunteerOfTheMonth(
          {
            recognitionPeriod: '2026-10',
            volunteerId: 'vol-1',
            selectionNotes: 'Duplicate award',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Rewards & Redemptions', () => {
    it('should return reward catalog with eligibility computed for user', async () => {
      dbMock.queryOne.mockResolvedValueOnce({ completed_count: 15 }); // 15 deliveries

      dbMock.query
        .mockResolvedValueOnce([{ achievement_code: 'DELIVERIES_10' }]) // earned achievements
        .mockResolvedValueOnce([{ reward_id: 'rw-pin', status: 'approved' }]) // redemptions
        .mockResolvedValueOnce([
          {
            id: 'rw-pin',
            reward_code: 'FOODLOOP_BADGE_PIN',
            title: 'Volunteer Pin',
            min_deliveries_required: 1,
            required_achievement_code: null,
            stock_quantity: 100,
          },
          {
            id: 'rw-tshirt',
            reward_code: 'FOODLOOP_TSHIRT',
            title: 'Rescuer T-Shirt',
            min_deliveries_required: 10,
            required_achievement_code: 'DELIVERIES_10',
            stock_quantity: 50,
          },
          {
            id: 'rw-gala',
            reward_code: 'ANNUAL_GALA_INVITE',
            title: 'Gala Invite',
            min_deliveries_required: 100, // Not eligible
            required_achievement_code: null,
            stock_quantity: 10,
          },
        ]); // rewards list

      const catalog = await service.getRewardsCatalog(mockVolunteerUser);

      expect(catalog.length).toBe(3);
      expect(catalog[0].hasRedeemed).toBe(true);
      expect(catalog[1].isEligible).toBe(true);
      expect(catalog[1].hasRedeemed).toBe(false);
      expect(catalog[2].isEligible).toBe(false); // 15 < 100
    });

    it('should reject redemption if user does not satisfy required deliveries', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({
          id: 'rw-tshirt',
          min_deliveries_required: 50,
          stock_quantity: 20,
          is_active: true,
        }) // reward lookup
        .mockResolvedValueOnce({ completed_count: 10 }); // only 10 deliveries

      await expect(
        service.requestRewardRedemption({ rewardId: 'rw-tshirt' }, mockVolunteerUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to review reward redemption and decrement stock upon approval', async () => {
      dbMock.queryOne
        .mockResolvedValueOnce({ id: 'red-1', reward_id: 'rw-1', status: 'pending' }) // redemption lookup
        .mockResolvedValueOnce({ id: 'red-1', status: 'approved' }); // updated redemption

      dbMock.query.mockResolvedValueOnce([]); // stock decrement

      const res = await service.reviewRewardRedemption(
        'red-1',
        { status: 'approved', reviewReason: 'Eligible and verified' },
        mockAdminUser,
      );

      expect(res.message).toContain('approved');
      expect(dbMock.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.rewards SET stock_quantity'),
        ['rw-1'],
      );
    });
  });
});
