import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import {
  UpdateProfileDto,
  RedeemRewardDto,
  ReviewRewardDto,
  LeaderboardQueryDto,
  VolunteerOfTheMonthDto,
  GenerateCertificateDto,
} from './dto';
import {
  VolunteerProfile,
  BadgeProgress,
  CertificateRecord,
  PublicCertificateVerification,
  LeaderboardEntry,
  VolunteerOfTheMonthRecord,
  RewardItem,
  RewardRedemptionRecord,
} from './recognition.interface';
import * as crypto from 'crypto';

@Injectable()
export class RecognitionService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Helper to anonymize full name for public leaderboards and certificates.
   */
  private maskName(fullName?: string | null): string {
    if (!fullName || fullName.trim().length === 0) return 'Anonymous Rescuer';

    // Array.from handles surrogate pairs / multi-codepoint characters correctly
    const parts = fullName.trim().split(/\s+/).filter((part) => part.length > 0);
    if (parts.length === 0) return 'Anonymous Rescuer';

    const firstChars = Array.from(parts[0]);
    const firstInitial = firstChars[0];
    if (!firstInitial) return 'Anonymous Rescuer';

    if (parts.length === 1) {
      // Single-word names (including initials or non-Latin scripts) always mask
      // to a well-formed string instead of ` ***` garbage
      return `${firstInitial}***`;
    }

    const lastChars = Array.from(parts[parts.length - 1]);
    const lastInitial = lastChars[0];
    return lastInitial ? `${parts[0]} ${lastInitial}.` : `${firstInitial}***`;
  }

  /**
   * GET /api/v1/recognition/me or /volunteers/:id
   */
  async getVolunteerProfile(
    targetVolunteerId: string,
    currentUser: AuthUser,
  ): Promise<VolunteerProfile> {
    const isSelf = currentUser.id === targetVolunteerId;
    const isAdmin = currentUser.role === AppRole.ADMIN;

    // 1. Fetch profile
    const profile = await this.db.queryOne<any>(
      `SELECT * FROM public.profiles WHERE id = $1;`,
      [targetVolunteerId],
    );

    if (!profile) {
      throw new NotFoundException(`Volunteer profile with ID "${targetVolunteerId}" was not found.`);
    }

    // 2. Automatically evaluate and reconcile achievements
    await this.evaluateAndAwardAchievements(targetVolunteerId);

    // 3. Compute operational stats
    const statsSql = `
      SELECT 
        COUNT(DISTINCT dt.id)::int as completed_deliveries,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as total_food_rescued_kg,
        COALESCE(ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(dt.delivered_at, dt.updated_at) - dt.accepted_at)) / 3600.0)::numeric, 1), 0)::numeric as volunteer_hours
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;

    const statsRow = await this.db.queryOne<any>(statsSql, [targetVolunteerId]);

    const activeSql = `
      SELECT COUNT(DISTINCT id)::int as active_deliveries
      FROM public.delivery_tasks
      WHERE volunteer_id = $1
        AND status IN ('assigned', 'accepted', 'pickup_confirmed', 'in_transit');
    `;

    const activeRow = await this.db.queryOne<any>(activeSql, [targetVolunteerId]);

    // 4. Achievement and certificate counts
    const countsSql = `
      SELECT 
        (SELECT COUNT(*)::int FROM public.volunteer_achievements WHERE volunteer_id = $1) as badges_count,
        (SELECT COUNT(*)::int FROM public.certificates WHERE volunteer_id = $1 AND is_revoked = false) as certificates_count;
    `;
    const countsRow = await this.db.queryOne<any>(countsSql, [targetVolunteerId]);

    const privacySettings = profile.privacy_settings || {
      showFullNameOnLeaderboard: true,
      showMetricsPublicly: true,
    };

    // Mask stats if privacy requested and viewer is not self or admin
    const shouldHideMetrics = !isSelf && !isAdmin && privacySettings.showMetricsPublicly === false;

    return {
      id: profile.id,
      fullName: (!isSelf && !isAdmin && !privacySettings.showFullNameOnLeaderboard)
        ? this.maskName(profile.full_name)
        : profile.full_name,
      role: profile.role,
      avatarUrl: profile.avatar_url || null,
      bio: profile.bio || null,
      privacySettings: {
        showFullNameOnLeaderboard: privacySettings.showFullNameOnLeaderboard ?? true,
        showMetricsPublicly: privacySettings.showMetricsPublicly ?? true,
      },
      stats: {
        completedDeliveries: shouldHideMetrics ? 0 : Number(statsRow?.completed_deliveries || 0),
        totalFoodRescuedKg: shouldHideMetrics ? 0 : Number(statsRow?.total_food_rescued_kg || 0),
        volunteerHours: shouldHideMetrics ? 0 : Number(statsRow?.volunteer_hours || 0),
        activeDeliveries: shouldHideMetrics ? 0 : Number(activeRow?.active_deliveries || 0),
      },
      earnedBadgesCount: Number(countsRow?.badges_count || 0),
      certificatesCount: Number(countsRow?.certificates_count || 0),
      joinedAt: new Date(profile.created_at).toISOString(),
    };
  }

  /**
   * PATCH /api/v1/recognition/me
   */
  async updateVolunteerProfile(
    dto: UpdateProfileDto,
    currentUser: AuthUser,
  ): Promise<any> {
    const updateClauses: string[] = ['updated_at = now()'];
    const values: any[] = [];
    let pIdx = 1;

    if (dto.avatarUrl !== undefined) {
      updateClauses.push(`avatar_url = $${pIdx++}`);
      values.push(dto.avatarUrl);
    }

    if (dto.bio !== undefined) {
      updateClauses.push(`bio = $${pIdx++}`);
      values.push(dto.bio);
    }

    if (dto.privacySettings !== undefined) {
      updateClauses.push(`privacy_settings = COALESCE(privacy_settings, '{}'::jsonb) || $${pIdx++}::jsonb`);
      values.push(JSON.stringify(dto.privacySettings));
    }

    values.push(currentUser.id);

    const sql = `
      UPDATE public.profiles
      SET ${updateClauses.join(', ')}
      WHERE id = $${pIdx}
      RETURNING id, full_name, role, avatar_url, bio, privacy_settings, updated_at;
    `;

    const updated = await this.db.queryOne<any>(sql, values);
    return {
      message: 'Volunteer profile updated successfully.',
      profile: updated,
    };
  }

  /**
   * Evaluates operational metrics and awards earned achievements automatically.
   */
  async evaluateAndAwardAchievements(volunteerId: string): Promise<void> {
    // 1. Get operational metrics
    const statsSql = `
      SELECT 
        COUNT(DISTINCT dt.id)::int as completed_count,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as total_kg
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;
    const stats = await this.db.queryOne<any>(statsSql, [volunteerId]);
    const deliveryCount = Number(stats?.completed_count || 0);
    const rescueKg = Number(stats?.total_kg || 0);

    // 2. Fetch active achievement definitions
    const defs = await this.db.query<any>(
      `SELECT * FROM public.achievement_definitions WHERE is_active = true;`,
    );

    for (const def of defs) {
      let qualifies = false;

      if (def.threshold_type === 'delivery_count' && deliveryCount >= Number(def.threshold_value)) {
        qualifies = true;
      } else if (def.threshold_type === 'rescue_kg' && rescueKg >= Number(def.threshold_value)) {
        qualifies = true;
      }

      if (qualifies) {
        // Idempotent insertion: ignore if already awarded
        await this.db.query(
          `
          INSERT INTO public.volunteer_achievements (
            volunteer_id, achievement_code, title, description, metadata, awarded_at
          )
          VALUES ($1, $2, $3, $4, $5, now())
          ON CONFLICT (volunteer_id, achievement_code) DO NOTHING;
          `,
          [
            volunteerId,
            def.achievement_code,
            def.title,
            def.description,
            JSON.stringify({
              deliveryCountAtAward: deliveryCount,
              rescueKgAtAward: rescueKg,
            }),
          ],
        );
      }
    }
  }

  /**
   * GET /api/v1/recognition/volunteers/:id/badges
   */
  async getBadges(
    targetVolunteerId: string,
    currentUser: AuthUser,
  ): Promise<BadgeProgress[]> {
    // Automatically evaluate first
    await this.evaluateAndAwardAchievements(targetVolunteerId);

    // Get current stats
    const statsSql = `
      SELECT 
        COUNT(DISTINCT dt.id)::int as completed_count,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as total_kg
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;
    const stats = await this.db.queryOne<any>(statsSql, [targetVolunteerId]);
    const deliveryCount = Number(stats?.completed_count || 0);
    const rescueKg = Number(stats?.total_kg || 0);

    const defs = await this.db.query<any>(
      `SELECT * FROM public.achievement_definitions WHERE is_active = true ORDER BY threshold_value ASC;`,
    );

    const earned = await this.db.query<any>(
      `SELECT * FROM public.volunteer_achievements WHERE volunteer_id = $1;`,
      [targetVolunteerId],
    );

    const earnedMap = new Map<string, any>();
    for (const e of earned) {
      earnedMap.set(e.achievement_code, e);
    }

    return defs.map((def) => {
      const isUnlocked = earnedMap.has(def.achievement_code);
      const threshold = Number(def.threshold_value);
      let current = 0;

      if (def.threshold_type === 'delivery_count') {
        current = deliveryCount;
      } else if (def.threshold_type === 'rescue_kg') {
        current = rescueKg;
      }

      const percentage = threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 100;

      return {
        achievementCode: def.achievement_code,
        title: def.title,
        description: def.description,
        badgeIcon: def.badge_icon,
        category: def.category,
        thresholdType: def.threshold_type,
        thresholdValue: threshold,
        currentValue: isUnlocked ? threshold : current,
        percentage: isUnlocked ? 100 : percentage,
        isUnlocked,
        awardedAt: isUnlocked ? new Date(earnedMap.get(def.achievement_code).awarded_at).toISOString() : undefined,
      };
    });
  }

  /**
   * GET /api/v1/recognition/certificates
   */
  async getCertificates(
    targetVolunteerId: string,
    currentUser: AuthUser,
  ): Promise<CertificateRecord[]> {
    const isSelf = currentUser.id === targetVolunteerId;
    const isAdmin = currentUser.role === AppRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Only the volunteer or an administrator can view certificate records.');
    }

    const rows = await this.db.query<any>(
      `
      SELECT c.*, p.full_name as volunteer_name, issuer.full_name as issued_by_name
      FROM public.certificates c
      JOIN public.profiles p ON p.id = c.volunteer_id
      LEFT JOIN public.profiles issuer ON issuer.id = c.issued_by
      WHERE c.volunteer_id = $1
      ORDER BY c.issued_at DESC;
      `,
      [targetVolunteerId],
    );

    return rows.map((r) => ({
      id: r.id,
      volunteerId: r.volunteer_id,
      volunteerName: r.volunteer_name,
      certificateCode: r.certificate_code,
      certificateType: r.certificate_type,
      title: r.title,
      issuedAt: new Date(r.issued_at).toISOString(),
      issuedByName: r.issued_by_name,
      filePath: r.file_path,
      isRevoked: r.is_revoked,
      revocationReason: r.revocation_reason,
    }));
  }

  /**
   * POST /api/v1/recognition/certificates/issue
   */
  async issueCertificate(
    dto: GenerateCertificateDto,
    currentUser: AuthUser,
  ): Promise<CertificateRecord> {
    const targetVolunteerId = dto.volunteerId || currentUser.id;

    if (currentUser.role !== AppRole.ADMIN && currentUser.id !== targetVolunteerId) {
      throw new ForbiddenException('You cannot issue certificates for another user.');
    }

    // 1. If tied to an achievement code, verify volunteer has earned it
    if (dto.achievementCode) {
      const achievement = await this.db.queryOne<any>(
        `SELECT * FROM public.volunteer_achievements WHERE volunteer_id = $1 AND achievement_code = $2;`,
        [targetVolunteerId, dto.achievementCode],
      );

      if (!achievement) {
        throw new BadRequestException(
          `CERTIFICATE VERIFICATION FAILED: Volunteer has not earned the qualifying achievement "${dto.achievementCode}".`,
        );
      }
    }

    // 2. Generate unique certificate reference
    const year = new Date().getFullYear();
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateCode = `FL-CERT-${year}-${randomSuffix}`;

    const insertSql = `
      INSERT INTO public.certificates (
        volunteer_id, certificate_code, certificate_type, title,
        issued_at, issued_by, is_revoked
      )
      VALUES ($1, $2, $3, $4, now(), $5, false)
      RETURNING *;
    `;

    const row = (await this.db.queryOne<any>(insertSql, [
      targetVolunteerId,
      certificateCode,
      dto.certificateType,
      dto.title,
      currentUser.id,
    ]))!;

    return {
      id: row.id,
      volunteerId: row.volunteer_id,
      certificateCode: row.certificate_code,
      certificateType: row.certificate_type,
      title: row.title,
      issuedAt: new Date(row.issued_at).toISOString(),
      isRevoked: false,
    };
  }

  /**
   * GET /api/v1/recognition/certificates/verify/:certificateCode (Public)
   */
  async verifyCertificatePublic(certificateCode: string): Promise<PublicCertificateVerification> {
    const cert = await this.db.queryOne<any>(
      `
      SELECT c.*, p.full_name as recipient_name
      FROM public.certificates c
      JOIN public.profiles p ON p.id = c.volunteer_id
      WHERE c.certificate_code = $1;
      `,
      [certificateCode.trim().toUpperCase()],
    );

    if (!cert) {
      return {
        isValid: false,
        certificateCode,
        status: 'not_found',
      };
    }

    if (cert.is_revoked) {
      return {
        isValid: false,
        certificateCode,
        title: cert.title,
        certificateType: cert.certificate_type,
        recipientName: this.maskName(cert.recipient_name),
        issuedAt: cert.issued_at ? new Date(cert.issued_at).toISOString() : undefined,
        status: 'revoked',
        revocationReason: cert.revocation_reason,
      };
    }

    return {
      isValid: true,
      certificateCode,
      title: cert.title,
      certificateType: cert.certificate_type,
      recipientName: this.maskName(cert.recipient_name),
      issuedAt: cert.issued_at ? new Date(cert.issued_at).toISOString() : undefined,
      status: 'valid',
    };
  }

  /**
   * GET /api/v1/recognition/leaderboard
   */
  async getLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<{ period: string; metric: string; entries: LeaderboardEntry[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["dt.status IN ('delivered', 'discrepancy_reported')"];
    const values: any[] = [];
    let pIdx = 1;

    // Time boundaries
    const targetYear = query.year || new Date().getFullYear();
    const targetMonth = query.month || (new Date().getMonth() + 1);

    if (query.period === 'monthly') {
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00.000Z`;
      whereClauses.push(`dt.delivered_at >= $${pIdx++}`);
      values.push(startDate);

      const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
      const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`;
      whereClauses.push(`dt.delivered_at < $${pIdx++}`);
      values.push(endDate);
    } else if (query.period === 'yearly') {
      const startDate = `${targetYear}-01-01T00:00:00.000Z`;
      whereClauses.push(`dt.delivered_at >= $${pIdx++}`);
      values.push(startDate);

      const endDate = `${targetYear + 1}-01-01T00:00:00.000Z`;
      whereClauses.push(`dt.delivered_at < $${pIdx++}`);
      values.push(endDate);
    }

    const whereSql = whereClauses.join(' AND ');

    let orderByCol = 'completed_deliveries DESC, total_food_rescued_kg DESC';
    if (query.metric === 'food_rescued_kg') {
      orderByCol = 'total_food_rescued_kg DESC, completed_deliveries DESC';
    } else if (query.metric === 'hours') {
      orderByCol = 'volunteer_hours DESC, completed_deliveries DESC';
    }

    const countSql = `
      SELECT COUNT(DISTINCT dt.volunteer_id)::int as total
      FROM public.delivery_tasks dt
      WHERE ${whereSql};
    `;
    const countRow = await this.db.queryOne<any>(countSql, values);
    const total = Number(countRow?.total || 0);

    const listSql = `
      SELECT 
        p.id as volunteer_id,
        p.full_name,
        p.avatar_url,
        p.privacy_settings,
        COUNT(DISTINCT dt.id)::int as completed_deliveries,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as total_food_rescued_kg,
        COALESCE(ROUND(SUM(EXTRACT(EPOCH FROM (COALESCE(dt.delivered_at, dt.updated_at) - dt.accepted_at)) / 3600.0)::numeric, 1), 0)::numeric as volunteer_hours
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.profiles p ON p.id = dt.volunteer_id
      WHERE ${whereSql}
      GROUP BY p.id, p.full_name, p.avatar_url, p.privacy_settings
      ORDER BY ${orderByCol}, p.id ASC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    values.push(limit, offset);
    const rows = await this.db.query<any>(listSql, values);

    const entries: LeaderboardEntry[] = rows.map((r, idx) => {
      const showFull = r.privacy_settings?.showFullNameOnLeaderboard ?? true;
      return {
        rank: offset + idx + 1,
        volunteerId: r.volunteer_id,
        displayName: showFull ? r.full_name : this.maskName(r.full_name),
        avatarUrl: r.avatar_url || null,
        completedDeliveries: Number(r.completed_deliveries),
        totalFoodRescuedKg: Number(r.total_food_rescued_kg),
        volunteerHours: Number(r.volunteer_hours),
      };
    });

    return {
      period: query.period,
      metric: query.metric,
      entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/recognition/volunteer-of-the-month
   */
  async getVolunteerOfTheMonthHistory(): Promise<VolunteerOfTheMonthRecord[]> {
    const rows = await this.db.query<any>(
      `
      SELECT 
        v.*,
        p.full_name as volunteer_name,
        p.avatar_url as volunteer_avatar,
        admin.full_name as selected_by_name
      FROM public.volunteer_of_the_month v
      JOIN public.profiles p ON p.id = v.volunteer_id
      LEFT JOIN public.profiles admin ON admin.id = v.selected_by
      ORDER BY v.recognition_period DESC;
      `,
    );

    return rows.map((r) => ({
      id: r.id,
      recognitionPeriod: r.recognition_period,
      volunteerId: r.volunteer_id,
      volunteerName: r.volunteer_name,
      avatarUrl: r.volunteer_avatar,
      selectionNotes: r.selection_notes,
      metricsSnapshot: r.metrics_snapshot,
      selectedByName: r.selected_by_name,
      awardedAt: new Date(r.awarded_at).toISOString(),
    }));
  }

  /**
   * POST /api/v1/recognition/volunteer-of-the-month (Admin)
   */
  async nominateVolunteerOfTheMonth(
    dto: VolunteerOfTheMonthDto,
    currentUser: AuthUser,
  ): Promise<VolunteerOfTheMonthRecord> {
    if (currentUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Only platform administrators can designate Volunteer of the Month.');
    }

    // Verify volunteer
    const volunteer = await this.db.queryOne<any>(
      `SELECT * FROM public.profiles WHERE id = $1;`,
      [dto.volunteerId],
    );

    if (!volunteer) {
      throw new NotFoundException(`Volunteer with ID "${dto.volunteerId}" was not found.`);
    }

    // Capture metrics snapshot
    const metricsSql = `
      SELECT 
        COUNT(DISTINCT dt.id)::int as count,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as kg
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;
    const metrics = await this.db.queryOne<any>(metricsSql, [dto.volunteerId]);

    const snapshot = {
      deliveriesCount: Number(metrics?.count || 0),
      rescuedKg: Number(metrics?.kg || 0),
    };

    // Insert with unique constraint on recognition_period
    try {
      const sql = `
        INSERT INTO public.volunteer_of_the_month (
          recognition_period, volunteer_id, selected_by, selection_notes, metrics_snapshot, awarded_at
        )
        VALUES ($1, $2, $3, $4, $5, now())
        RETURNING *;
      `;
      const inserted = (await this.db.queryOne<any>(sql, [
        dto.recognitionPeriod,
        dto.volunteerId,
        currentUser.id,
        dto.selectionNotes,
        JSON.stringify(snapshot),
      ]))!;

      return {
        id: inserted.id,
        recognitionPeriod: inserted.recognition_period,
        volunteerId: inserted.volunteer_id,
        volunteerName: volunteer.full_name,
        avatarUrl: volunteer.avatar_url || null,
        selectionNotes: inserted.selection_notes,
        metricsSnapshot: snapshot,
        selectedByName: currentUser.fullName,
        awardedAt: new Date(inserted.awarded_at).toISOString(),
      };
    } catch (err: any) {
      if (err.message?.includes('volunteer_of_the_month_recognition_period_key')) {
        throw new ConflictException(
          `DUPLICATE AWARD PREVENTED: Volunteer of the Month for period "${dto.recognitionPeriod}" has already been awarded.`,
        );
      }
      throw err;
    }
  }

  /**
   * GET /api/v1/recognition/rewards
   */
  async getRewardsCatalog(currentUser: AuthUser): Promise<RewardItem[]> {
    // 1. Get user delivery metrics & achievements
    const statsSql = `
      SELECT COUNT(DISTINCT dt.id)::int as completed_count
      FROM public.delivery_tasks dt
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;
    const statsRow = await this.db.queryOne<any>(statsSql, [currentUser.id]);
    const completedCount = Number(statsRow?.completed_count || 0);

    const achievements = await this.db.query<any>(
      `SELECT achievement_code FROM public.volunteer_achievements WHERE volunteer_id = $1;`,
      [currentUser.id],
    );
    const earnedCodes = new Set(achievements.map((a) => a.achievement_code));

    // 2. Fetch redemptions by user
    const redemptions = await this.db.query<any>(
      `SELECT reward_id, status FROM public.reward_redemptions WHERE volunteer_id = $1;`,
      [currentUser.id],
    );
    const redemptionsMap = new Map<string, string>();
    for (const r of redemptions) {
      redemptionsMap.set(r.reward_id, r.status);
    }

    // 3. Fetch rewards catalog
    const rewards = await this.db.query<any>(
      `SELECT * FROM public.rewards WHERE is_active = true ORDER BY min_deliveries_required ASC;`,
    );

    return rewards.map((rw) => {
      const meetsDeliveries = completedCount >= rw.min_deliveries_required;
      const meetsAchievement = !rw.required_achievement_code || earnedCodes.has(rw.required_achievement_code);
      const isEligible = meetsDeliveries && meetsAchievement && rw.stock_quantity > 0;
      const hasRedeemed = redemptionsMap.has(rw.id);

      return {
        id: rw.id,
        rewardCode: rw.reward_code,
        title: rw.title,
        description: rw.description,
        category: rw.category,
        requiredAchievementCode: rw.required_achievement_code,
        minDeliveriesRequired: rw.min_deliveries_required,
        stockQuantity: rw.stock_quantity,
        isEligible,
        hasRedeemed,
        redemptionStatus: redemptionsMap.get(rw.id) || null,
      };
    });
  }

  /**
   * POST /api/v1/recognition/rewards/redeem
   */
  async requestRewardRedemption(
    dto: RedeemRewardDto,
    currentUser: AuthUser,
  ): Promise<any> {
    const reward = await this.db.queryOne<any>(
      `SELECT * FROM public.rewards WHERE id = $1 AND is_active = true;`,
      [dto.rewardId],
    );

    if (!reward) {
      throw new NotFoundException(`Reward with ID "${dto.rewardId}" was not found or is no longer active.`);
    }

    if (reward.stock_quantity <= 0) {
      throw new BadRequestException('Sorry, this reward is currently out of stock.');
    }

    // Verify eligibility
    const statsSql = `
      SELECT COUNT(DISTINCT dt.id)::int as completed_count
      FROM public.delivery_tasks dt
      WHERE dt.volunteer_id = $1
        AND dt.status IN ('delivered', 'discrepancy_reported');
    `;
    const statsRow = await this.db.queryOne<any>(statsSql, [currentUser.id]);
    const completedCount = Number(statsRow?.completed_count || 0);

    if (completedCount < reward.min_deliveries_required) {
      throw new BadRequestException(
        `ELIGIBILITY REQUIREMENT: Reward requires at least ${reward.min_deliveries_required} completed deliveries (you have ${completedCount}).`,
      );
    }

    if (reward.required_achievement_code) {
      const hasAchievement = await this.db.queryOne<any>(
        `SELECT id FROM public.volunteer_achievements WHERE volunteer_id = $1 AND achievement_code = $2;`,
        [currentUser.id, reward.required_achievement_code],
      );

      if (!hasAchievement) {
        throw new BadRequestException(
          `ACHIEVEMENT REQUIRED: You must earn the "${reward.required_achievement_code}" achievement to claim this reward.`,
        );
      }
    }

    try {
      const insertSql = `
        INSERT INTO public.reward_redemptions (
          reward_id, volunteer_id, status, request_notes, created_at, updated_at
        )
        VALUES ($1, $2, 'pending', $3, now(), now())
        RETURNING *;
      `;

      const redemption = (await this.db.queryOne<any>(insertSql, [
        dto.rewardId,
        currentUser.id,
        dto.requestNotes || null,
      ]))!;

      return {
        message: 'Reward redemption request submitted successfully. It will be reviewed by an administrator.',
        redemption,
      };
    } catch (err: any) {
      if (err.message?.includes('uq_volunteer_reward')) {
        throw new ConflictException('DUPLICATE REDEMPTION: You have already submitted a redemption request for this reward.');
      }
      throw err;
    }
  }

  /**
   * GET /api/v1/recognition/rewards/requests (Admin)
   */
  async getRewardRequests(): Promise<RewardRedemptionRecord[]> {
    const rows = await this.db.query<any>(
      `
      SELECT 
        rr.*,
        rw.title as reward_title,
        rw.reward_code,
        p.full_name as volunteer_name,
        reviewer.full_name as reviewed_by_name
      FROM public.reward_redemptions rr
      JOIN public.rewards rw ON rw.id = rr.reward_id
      JOIN public.profiles p ON p.id = rr.volunteer_id
      LEFT JOIN public.profiles reviewer ON reviewer.id = rr.reviewed_by
      ORDER BY rr.created_at DESC;
      `,
    );

    return rows.map((r) => ({
      id: r.id,
      rewardId: r.reward_id,
      rewardTitle: r.reward_title,
      rewardCode: r.reward_code,
      volunteerId: r.volunteer_id,
      volunteerName: r.volunteer_name,
      status: r.status,
      requestNotes: r.request_notes,
      reviewedByName: r.reviewed_by_name,
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : undefined,
      reviewReason: r.review_reason,
      fulfillmentDetails: r.fulfillment_details,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  /**
   * PATCH /api/v1/recognition/rewards/requests/:id (Admin)
   */
  async reviewRewardRedemption(
    redemptionId: string,
    dto: ReviewRewardDto,
    currentUser: AuthUser,
  ): Promise<any> {
    if (currentUser.role !== AppRole.ADMIN) {
      throw new ForbiddenException('Only platform administrators can review reward redemptions.');
    }

    const redemption = await this.db.queryOne<any>(
      `SELECT * FROM public.reward_redemptions WHERE id = $1;`,
      [redemptionId],
    );

    if (!redemption) {
      throw new NotFoundException(`Reward redemption with ID "${redemptionId}" was not found.`);
    }

    const updated = (await this.db.queryOne<any>(
      `
      UPDATE public.reward_redemptions
      SET 
        status = $1,
        review_reason = COALESCE($2, review_reason),
        fulfillment_details = COALESCE($3, fulfillment_details),
        reviewed_by = $4,
        reviewed_at = now(),
        updated_at = now()
      WHERE id = $5
      RETURNING *;
      `,
      [dto.status, dto.reviewReason || null, dto.fulfillmentDetails || null, currentUser.id, redemptionId],
    ))!;

    // Decrement stock if newly approved or fulfilled
    if (['approved', 'fulfilled'].includes(dto.status) && redemption.status === 'pending') {
      await this.db.query(
        `UPDATE public.rewards SET stock_quantity = GREATEST(0, stock_quantity - 1) WHERE id = $1;`,
        [redemption.reward_id],
      );
    }

    return {
      message: `Reward request ${dto.status} successfully.`,
      redemption: updated,
    };
  }
}
