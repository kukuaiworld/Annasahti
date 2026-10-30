import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import {
  ImpactQueryDto,
  ImpactTrendsQueryDto,
  ImpactReportQueryDto,
} from './dto/impact-query.dto';
import {
  ImpactOverview,
  TrendPoint,
  CategoryBreakdown,
  MetricDefinition,
  MethodologyDetail,
} from './impact.interface';

@Injectable()
export class ImpactService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Resolve and enforce tenant isolation for impact analytics.
   */
  private resolveOrganisationScope(
    requestedOrgId: string | undefined,
    user: AuthUser,
  ): { targetOrgId: string | null; isPlatformWide: boolean } {
    if (user.role === AppRole.ADMIN) {
      if (requestedOrgId) {
        return { targetOrgId: requestedOrgId, isPlatformWide: false };
      }
      return { targetOrgId: null, isPlatformWide: true };
    }

    // Non-admin users are strictly restricted to their own organisation
    if (!user.organisationId) {
      throw new ForbiddenException(
        'You are not associated with an organisation and cannot view private impact analytics.',
      );
    }

    if (requestedOrgId && requestedOrgId !== user.organisationId) {
      throw new ForbiddenException(
        'SECURITY VIOLATION: You do not have permission to view impact analytics for another organisation.',
      );
    }

    return { targetOrgId: user.organisationId, isPlatformWide: false };
  }

  /**
   * Validate date range boundaries.
   */
  private validateDateRange(startDate?: string, endDate?: string): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start.getTime() > end.getTime()) {
        throw new BadRequestException(
          `Invalid date range: startDate (${startDate}) cannot be after endDate (${endDate}).`,
        );
      }
    }
  }

  /**
   * GET /api/v1/impact/overview
   */
  async getOverview(query: ImpactQueryDto, user: AuthUser): Promise<ImpactOverview> {
    this.validateDateRange(query.startDate, query.endDate);
    const { targetOrgId, isPlatformWide } = this.resolveOrganisationScope(
      query.organisationId,
      user,
    );

    // 1. Fetch active calculation methodologies
    const mealMethodology = await this.db.queryOne<any>(
      `SELECT * FROM public.impact_methodologies WHERE methodology_code = 'MEAL_EQUIVALENT_GFN_V1' AND is_active = true;`,
    );

    const co2eMethodology = await this.db.queryOne<any>(
      `SELECT * FROM public.impact_methodologies WHERE methodology_code = 'CO2E_AVOIDED_EPA_WARM_V1' AND is_active = true;`,
    );

    // Factors from approved methodologies
    const kgPerMeal = mealMethodology?.assumptions?.kg_per_meal ?? 0.42;
    const humanCo2eFactor = co2eMethodology?.assumptions?.human_food_diversion_kg_co2e_per_kg ?? 2.5;
    const animalCo2eFactor = co2eMethodology?.assumptions?.animal_feed_diversion_kg_co2e_per_kg ?? 2.1;
    const wasteCo2eFactor = co2eMethodology?.assumptions?.composting_diversion_kg_co2e_per_kg ?? 0.52;

    // 2. Aggregate completed delivery operations
    const deliverySql = `
      SELECT 
        COALESCE(SUM(CASE WHEN b.category = 'human_consumption' THEN dc.received_quantity ELSE 0 END), 0)::numeric as human_delivered_kg,
        COALESCE(SUM(CASE WHEN b.category = 'human_consumption' AND ro.organisation_type = 'humanitarian_ngo' THEN dc.received_quantity ELSE 0 END), 0)::numeric as ngo_delivered_kg,
        COALESCE(SUM(CASE WHEN b.category = 'human_consumption' AND ro.organisation_type != 'humanitarian_ngo' THEN dc.received_quantity ELSE 0 END), 0)::numeric as other_human_delivered_kg,
        COALESCE(SUM(CASE WHEN b.category = 'animal_appropriate' THEN dc.received_quantity ELSE 0 END), 0)::numeric as animal_delivered_kg,
        COUNT(DISTINCT CASE WHEN b.category = 'animal_appropriate' THEN dt.id END)::int as animal_deliveries_count,
        COUNT(DISTINCT dt.id)::int as total_deliveries_count,
        COALESCE(SUM(dc.damaged_quantity), 0)::numeric as total_damaged_kg,
        COALESCE(SUM(dc.missing_quantity), 0)::numeric as total_missing_kg
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      WHERE dt.status IN ('delivered', 'discrepancy_reported')
        AND ($1::timestamptz IS NULL OR dt.delivered_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR dt.delivered_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR b.donor_organisation_id = $3::uuid OR a.recipient_organisation_id = $3::uuid);
    `;

    const deliveryStats = (await this.db.queryOne<any>(deliverySql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ])) || {
      human_delivered_kg: 0,
      ngo_delivered_kg: 0,
      other_human_delivered_kg: 0,
      animal_delivered_kg: 0,
      animal_deliveries_count: 0,
      total_deliveries_count: 0,
      total_damaged_kg: 0,
      total_missing_kg: 0,
    };

    // 3. Aggregate completed waste processing operations
    const wasteSql = `
      SELECT 
        COALESCE(SUM(wp.quantity_processed), 0)::numeric as waste_processed_kg,
        COUNT(DISTINCT wp.id)::int as waste_records_count
      FROM public.waste_processing_records wp
      JOIN public.food_batches b ON b.id = wp.batch_id
      WHERE wp.status = 'completed'
        AND ($1::timestamptz IS NULL OR wp.completed_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR wp.completed_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR wp.processor_organisation_id = $3::uuid OR b.donor_organisation_id = $3::uuid);
    `;

    const wasteStats = (await this.db.queryOne<any>(wasteSql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ])) || {
      waste_processed_kg: 0,
      waste_records_count: 0,
    };

    // Quantities converted to Numbers
    const humanKg = Number(deliveryStats.human_delivered_kg);
    const ngoKg = Number(deliveryStats.ngo_delivered_kg);
    const otherHumanKg = Number(deliveryStats.other_human_delivered_kg);
    const animalKg = Number(deliveryStats.animal_delivered_kg);
    const wasteKg = Number(wasteStats.waste_processed_kg);
    const damagedKg = Number(deliveryStats.total_damaged_kg);
    const missingKg = Number(deliveryStats.total_missing_kg);

    // Derived Calculations
    const mealsRescued = mealMethodology
      ? Math.round(humanKg / kgPerMeal)
      : null;

    const humanCo2e = Number((humanKg * humanCo2eFactor).toFixed(2));
    const animalCo2e = Number((animalKg * animalCo2eFactor).toFixed(2));
    const wasteCo2e = Number((wasteKg * wasteCo2eFactor).toFixed(2));
    const totalCo2e = co2eMethodology
      ? Number((humanCo2e + animalCo2e + wasteCo2e).toFixed(2))
      : null;

    // Optional org name
    let orgName: string | undefined;
    if (targetOrgId) {
      const org = await this.db.queryOne<any>(
        `SELECT name FROM public.organisations WHERE id = $1;`,
        [targetOrgId],
      );
      orgName = org?.name;
    }

    return {
      reportingPeriod: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        timezone: query.timezone || 'UTC',
      },
      filter: {
        organisationId: targetOrgId || undefined,
        organisationName: orgName,
        isPlatformWide,
      },
      metrics: {
        mealsRescued: {
          value: mealsRescued,
          unit: 'meals',
          status: mealMethodology ? 'calculated' : 'unavailable',
          methodologyCode: mealMethodology?.methodology_code || 'UNAVAILABLE',
          methodologyVersion: mealMethodology?.version || '0.0.0',
          factorUsed: `${kgPerMeal} kg per meal equivalent`,
          note: 'Calculated exclusively from verified human-consumption deliveries.',
        },
        humanFoodDeliveredKg: {
          value: humanKg,
          unit: 'kg',
          eligibleOrganisationsKg: humanKg,
          ngoSpecificKg: ngoKg,
          otherHumanitarianKg: otherHumanKg,
        },
        animalAppropriateFoodKg: {
          value: animalKg,
          unit: 'kg',
          deliveriesCount: Number(deliveryStats.animal_deliveries_count),
        },
        organicWasteProcessedKg: {
          value: wasteKg,
          unit: 'kg',
          recordsCount: Number(wasteStats.waste_records_count),
        },
        successfulDeliveriesCount: {
          value: Number(deliveryStats.total_deliveries_count),
          unit: 'deliveries',
        },
        co2eAvoidedKg: {
          value: totalCo2e,
          unit: 'kg CO2e',
          isEstimate: true,
          methodologyCode: co2eMethodology?.methodology_code || 'UNAVAILABLE',
          methodologyVersion: co2eMethodology?.version || '0.0.0',
          breakdown: {
            humanFoodDiversionKgCo2e: humanCo2e,
            animalFeedDiversionKgCo2e: animalCo2e,
            organicWasteCompostingKgCo2e: wasteCo2e,
          },
          disclaimer:
            'Estimated greenhouse gas savings based on EPA WARM v16 municipal landfill diversion modeling. Not directly metered emissions.',
        },
      },
      dataQuality: {
        unreconciledLossKg: Number((damagedKg + missingKg).toFixed(2)),
        damagedQuantityKg: damagedKg,
        missingQuantityKg: missingKg,
        dataFreshnessTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * GET /api/v1/impact/trends
   */
  async getTrends(
    query: ImpactTrendsQueryDto,
    user: AuthUser,
  ): Promise<{ reportingPeriod: any; period: string; series: TrendPoint[] }> {
    this.validateDateRange(query.startDate, query.endDate);
    const { targetOrgId } = this.resolveOrganisationScope(query.organisationId, user);

    const truncFormat = query.period === 'yearly' ? 'year' : 'month';
    const dateFormat = query.period === 'yearly' ? 'YYYY' : 'YYYY-MM';

    // 1. Delivery aggregation by time bucket
    const deliveryTrendSql = `
      SELECT 
        TO_CHAR(DATE_TRUNC('${truncFormat}', dt.delivered_at), '${dateFormat}') as period_key,
        DATE_TRUNC('${truncFormat}', dt.delivered_at) as period_start,
        (DATE_TRUNC('${truncFormat}', dt.delivered_at) + interval '1 ${truncFormat}' - interval '1 second') as period_end,
        COALESCE(SUM(CASE WHEN b.category = 'human_consumption' THEN dc.received_quantity ELSE 0 END), 0)::numeric as human_kg,
        COALESCE(SUM(CASE WHEN b.category = 'animal_appropriate' THEN dc.received_quantity ELSE 0 END), 0)::numeric as animal_kg,
        COUNT(DISTINCT dt.id)::int as deliveries_count
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE dt.status IN ('delivered', 'discrepancy_reported')
        AND ($1::timestamptz IS NULL OR dt.delivered_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR dt.delivered_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR b.donor_organisation_id = $3::uuid OR a.recipient_organisation_id = $3::uuid)
      GROUP BY 1, 2, 3
      ORDER BY 2 ASC;
    `;

    const deliveryRows = await this.db.query(deliveryTrendSql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ]);

    // 2. Waste processing aggregation by time bucket
    const wasteTrendSql = `
      SELECT 
        TO_CHAR(DATE_TRUNC('${truncFormat}', wp.completed_at), '${dateFormat}') as period_key,
        COALESCE(SUM(wp.quantity_processed), 0)::numeric as waste_kg
      FROM public.waste_processing_records wp
      JOIN public.food_batches b ON b.id = wp.batch_id
      WHERE wp.status = 'completed'
        AND ($1::timestamptz IS NULL OR wp.completed_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR wp.completed_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR wp.processor_organisation_id = $3::uuid OR b.donor_organisation_id = $3::uuid)
      GROUP BY 1;
    `;

    const wasteRows = await this.db.query(wasteTrendSql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ]);

    const wasteMap = new Map<string, number>();
    for (const r of wasteRows) {
      wasteMap.set(r.period_key, Number(r.waste_kg));
    }

    // Merge map
    const trendMap = new Map<string, TrendPoint>();
    for (const r of deliveryRows) {
      const humanKg = Number(r.human_kg);
      const animalKg = Number(r.animal_kg);
      const wasteKg = wasteMap.get(r.period_key) || 0;
      const meals = Math.round(humanKg / 0.42);
      const co2e = Number((humanKg * 2.5 + animalKg * 2.1 + wasteKg * 0.52).toFixed(2));

      trendMap.set(r.period_key, {
        periodKey: r.period_key,
        periodStart: new Date(r.period_start).toISOString(),
        periodEnd: new Date(r.period_end).toISOString(),
        mealsRescued: meals,
        humanFoodDeliveredKg: humanKg,
        animalFoodRecoveredKg: animalKg,
        organicWasteProcessedKg: wasteKg,
        successfulDeliveriesCount: Number(r.deliveries_count),
        estimatedCo2eAvoidedKg: co2e,
      });
    }

    // Add any waste-only periods
    for (const [key, wasteKg] of wasteMap.entries()) {
      if (!trendMap.has(key)) {
        const co2e = Number((wasteKg * 0.52).toFixed(2));
        trendMap.set(key, {
          periodKey: key,
          periodStart: key,
          periodEnd: key,
          mealsRescued: 0,
          humanFoodDeliveredKg: 0,
          animalFoodRecoveredKg: 0,
          organicWasteProcessedKg: wasteKg,
          successfulDeliveriesCount: 0,
          estimatedCo2eAvoidedKg: co2e,
        });
      }
    }

    const series = Array.from(trendMap.values()).sort((a, b) =>
      a.periodKey.localeCompare(b.periodKey),
    );

    return {
      reportingPeriod: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        timezone: query.timezone || 'UTC',
      },
      period: query.period,
      series,
    };
  }

  /**
   * GET /api/v1/impact/categories
   */
  async getCategoriesBreakdown(
    query: ImpactQueryDto,
    user: AuthUser,
  ): Promise<CategoryBreakdown> {
    this.validateDateRange(query.startDate, query.endDate);
    const { targetOrgId } = this.resolveOrganisationScope(query.organisationId, user);

    const deliverySql = `
      SELECT 
        b.category,
        COALESCE(SUM(dc.received_quantity), 0)::numeric as total_kg,
        COUNT(DISTINCT dt.id)::int as count
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE dt.status IN ('delivered', 'discrepancy_reported')
        AND ($1::timestamptz IS NULL OR dt.delivered_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR dt.delivered_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR b.donor_organisation_id = $3::uuid OR a.recipient_organisation_id = $3::uuid)
      GROUP BY b.category;
    `;

    const deliveryRows = await this.db.query(deliverySql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ]);

    let humanKg = 0;
    let humanCount = 0;
    let animalKg = 0;
    let animalCount = 0;

    for (const r of deliveryRows) {
      if (r.category === 'human_consumption') {
        humanKg = Number(r.total_kg);
        humanCount = Number(r.count);
      } else if (r.category === 'animal_appropriate') {
        animalKg = Number(r.total_kg);
        animalCount = Number(r.count);
      }
    }

    const wasteSql = `
      SELECT 
        COALESCE(SUM(wp.quantity_processed), 0)::numeric as waste_kg,
        COUNT(DISTINCT wp.id)::int as waste_count
      FROM public.waste_processing_records wp
      JOIN public.food_batches b ON b.id = wp.batch_id
      WHERE wp.status = 'completed'
        AND ($1::timestamptz IS NULL OR wp.completed_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR wp.completed_at <= $2::timestamptz)
        AND ($3::uuid IS NULL OR wp.processor_organisation_id = $3::uuid OR b.donor_organisation_id = $3::uuid);
    `;

    const wasteRow = await this.db.queryOne<any>(wasteSql, [
      query.startDate || null,
      query.endDate || null,
      targetOrgId,
    ]);

    const wasteKg = Number(wasteRow?.waste_kg || 0);
    const wasteCount = Number(wasteRow?.waste_count || 0);

    const totalDiversion = humanKg + animalKg + wasteKg;
    const humanPct = totalDiversion > 0 ? Number(((humanKg / totalDiversion) * 100).toFixed(1)) : 0;
    const animalPct = totalDiversion > 0 ? Number(((animalKg / totalDiversion) * 100).toFixed(1)) : 0;
    const wastePct = totalDiversion > 0 ? Number(((wasteKg / totalDiversion) * 100).toFixed(1)) : 0;

    return {
      reportingPeriod: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
      categories: {
        humanConsumption: {
          category: 'human_consumption',
          label: 'Human Food Rescue',
          totalKg: humanKg,
          percentage: humanPct,
          deliveryCount: humanCount,
          mealsEquivalent: Math.round(humanKg / 0.42),
        },
        animalAppropriate: {
          category: 'animal_appropriate',
          label: 'Animal Feed Recovery',
          totalKg: animalKg,
          percentage: animalPct,
          deliveryCount: animalCount,
        },
        organicWaste: {
          category: 'organic_waste',
          label: 'Organic Waste Processing',
          totalKg: wasteKg,
          percentage: wastePct,
          processingRecordsCount: wasteCount,
        },
      },
      totalDiversionKg: Number(totalDiversion.toFixed(2)),
      duplicatePreventionNotice:
        'Mutually exclusive categorization: Human consumption, animal recovery, and organic waste routes are verified through separate quality inspection decisions and cannot double-count physical inventory.',
    };
  }

  /**
   * GET /api/v1/impact/organisations/:organisationId
   */
  async getOrganisationImpact(
    organisationId: string,
    query: ImpactQueryDto,
    user: AuthUser,
  ): Promise<any> {
    // Role check: Only organisation members or admin can view
    if (user.role !== AppRole.ADMIN && user.organisationId !== organisationId) {
      throw new ForbiddenException(
        'SECURITY ENFORCEMENT: You do not have permission to view impact analytics for this organisation.',
      );
    }

    const org = await this.db.queryOne<any>(
      `SELECT id, name, organisation_type, verification_status FROM public.organisations WHERE id = $1;`,
      [organisationId],
    );

    if (!org) {
      throw new NotFoundException(`Organisation with ID "${organisationId}" was not found.`);
    }

    const overview = await this.getOverview({ ...query, organisationId }, user);
    const trends = await this.getTrends(
      { ...query, organisationId, period: 'monthly' },
      user,
    );

    return {
      organisation: org,
      overview,
      trends: trends.series,
    };
  }

  /**
   * GET /api/v1/impact/definitions
   */
  async getMetricDefinitions(): Promise<MetricDefinition[]> {
    return [
      {
        metricKey: 'meals_rescued',
        displayName: 'Meals Rescued',
        unit: 'meals',
        description: 'Estimated meal equivalents delivered to hunger-relief organizations for direct human consumption.',
        sourceRecord: 'delivery_confirmations (received_quantity)',
        qualifyingStatus: 'delivery_tasks.status IN (delivered, discrepancy_reported) AND food_batches.category = human_consumption',
        aggregationMethod: 'ROUND(SUM(received_quantity_kg) / 0.42)',
        isEstimate: true,
        status: 'active',
        methodologyCode: 'MEAL_EQUIVALENT_GFN_V1',
        methodologyVersion: '1.0.0',
      },
      {
        metricKey: 'human_food_delivered_kg',
        displayName: 'Food Delivered to Eligible Human Organisations',
        unit: 'kg',
        description: 'Authoritative physical quantity of human-consumption food successfully handed over at destination.',
        sourceRecord: 'delivery_confirmations (received_quantity)',
        qualifyingStatus: 'delivery_tasks.status IN (delivered, discrepancy_reported) AND food_batches.category = human_consumption',
        aggregationMethod: 'SUM(received_quantity)',
        isEstimate: false,
        status: 'active',
      },
      {
        metricKey: 'animal_food_recovered_kg',
        displayName: 'Animal-Appropriate Food Recovered',
        unit: 'kg',
        description: 'Delivered food inspected, approved, and routed to verified animal welfare shelters.',
        sourceRecord: 'delivery_confirmations (received_quantity)',
        qualifyingStatus: 'delivery_tasks.status = delivered AND food_batches.category = animal_appropriate',
        aggregationMethod: 'SUM(received_quantity)',
        isEstimate: false,
        status: 'active',
      },
      {
        metricKey: 'organic_waste_processed_kg',
        displayName: 'Organic Waste Processed',
        unit: 'kg',
        description: 'Food diverted to licensed composting, biomethanation, or insect-bioconversion facilities.',
        sourceRecord: 'waste_processing_records (quantity_processed)',
        qualifyingStatus: 'waste_processing_records.status = completed',
        aggregationMethod: 'SUM(quantity_processed)',
        isEstimate: false,
        status: 'active',
      },
      {
        metricKey: 'successful_deliveries_count',
        displayName: 'Successful Deliveries Completed',
        unit: 'deliveries',
        description: 'Count of unique delivery missions completed with signed recipient confirmation.',
        sourceRecord: 'delivery_tasks',
        qualifyingStatus: 'status = delivered',
        aggregationMethod: 'COUNT(DISTINCT id)',
        isEstimate: false,
        status: 'active',
      },
      {
        metricKey: 'co2e_avoided_kg',
        displayName: 'Estimated CO2e Avoided',
        unit: 'kg CO2e',
        description: 'Modeled greenhouse gas emissions avoided by diverting organic materials from anaerobic landfills.',
        sourceRecord: 'delivery_confirmations & waste_processing_records',
        qualifyingStatus: 'delivered / completed',
        aggregationMethod: 'SUM(kg * emissions_factor)',
        isEstimate: true,
        status: 'active',
        methodologyCode: 'CO2E_AVOIDED_EPA_WARM_V1',
        methodologyVersion: '1.0.0',
      },
    ];
  }

  /**
   * GET /api/v1/impact/co2e/methodology
   */
  async getCo2eMethodology(): Promise<MethodologyDetail> {
    const methodology = await this.db.queryOne<any>(
      `SELECT * FROM public.impact_methodologies WHERE methodology_code = 'CO2E_AVOIDED_EPA_WARM_V1' AND is_active = true;`,
    );

    if (!methodology) {
      throw new NotFoundException('Active CO2e estimation methodology configuration was not found.');
    }

    return {
      methodologyCode: methodology.methodology_code,
      version: methodology.version,
      description: methodology.description,
      sourceReference: methodology.source_reference,
      assumptions: methodology.assumptions,
      isActive: methodology.is_active,
      createdAt: new Date(methodology.created_at).toISOString(),
    };
  }

  /**
   * GET /api/v1/impact/report
   */
  async getDetailedReport(query: ImpactReportQueryDto, user: AuthUser): Promise<any> {
    this.validateDateRange(query.startDate, query.endDate);
    const { targetOrgId } = this.resolveOrganisationScope(query.organisationId, user);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["dt.status IN ('delivered', 'discrepancy_reported')"];
    const values: any[] = [];
    let pIdx = 1;

    if (query.startDate) {
      whereClauses.push(`dt.delivered_at >= $${pIdx++}`);
      values.push(query.startDate);
    }

    if (query.endDate) {
      whereClauses.push(`dt.delivered_at <= $${pIdx++}`);
      values.push(query.endDate);
    }

    if (targetOrgId) {
      whereClauses.push(`(b.donor_organisation_id = $${pIdx} OR a.recipient_organisation_id = $${pIdx})`);
      values.push(targetOrgId);
      pIdx++;
    }

    if (query.category) {
      whereClauses.push(`b.category = $${pIdx++}`);
      values.push(query.category);
    }

    const whereSql = whereClauses.join(' AND ');

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE ${whereSql};
    `;

    const countRow = await this.db.queryOne<any>(countSql, values);
    const total = Number(countRow?.total || 0);

    const listSql = `
      SELECT 
        dt.id as delivery_task_id,
        dt.status as delivery_status,
        dt.delivered_at,
        b.id as batch_id,
        b.batch_code,
        b.food_name,
        b.category as destination_category,
        donor.name as donor_organisation_name,
        ro.name as recipient_organisation_name,
        ro.organisation_type as recipient_organisation_type,
        dc.received_quantity,
        dc.damaged_quantity,
        dc.missing_quantity,
        dc.quantity_unit,
        dc.confirmed_at,
        CASE 
          WHEN b.category = 'human_consumption' THEN ROUND(dc.received_quantity / 0.42)
          ELSE 0
        END as meals_equivalent,
        CASE 
          WHEN b.category = 'human_consumption' THEN ROUND((dc.received_quantity * 2.50)::numeric, 2)
          WHEN b.category = 'animal_appropriate' THEN ROUND((dc.received_quantity * 2.10)::numeric, 2)
          ELSE 0
        END as estimated_co2e_avoided_kg
      FROM public.delivery_tasks dt
      JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      WHERE ${whereSql}
      ORDER BY dt.delivered_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    values.push(limit, offset);
    const records = await this.db.query(listSql, values);

    return {
      records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
