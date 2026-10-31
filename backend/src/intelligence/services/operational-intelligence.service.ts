import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../common/enums/app.enums';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

export interface OperationalSummaryQuery {
  startDate?: string;
  endDate?: string;
  organisationId?: string;
}

@Injectable()
export class OperationalIntelligenceService {
  constructor(private readonly db: DatabaseService) {}

  private resolveScope(user: AuthUser, requestedOrgId?: string): string | null {
    if (user.role === AppRole.ADMIN) {
      return requestedOrgId || null;
    }
    if (!user.organisationId) {
      throw new ForbiddenException(
        'You must be associated with an active organisation to view operational intelligence.',
      );
    }
    if (requestedOrgId && requestedOrgId !== user.organisationId) {
      throw new ForbiddenException('Cross-organisation access denied.');
    }
    return user.organisationId;
  }

  async getOperationalSummary(
    query: OperationalSummaryQuery,
    user: AuthUser,
  ): Promise<any> {
    const orgId = this.resolveScope(user, query.organisationId);

    // 1. Delivery performance counts
    const deliverySql = `
      SELECT
        COUNT(DISTINCT dt.id)::int AS total_deliveries,
        COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'delivered')::int AS delivered_count,
        COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'discrepancy_reported')::int AS discrepancy_count,
        COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'cancelled')::int AS cancelled_count,
        COUNT(DISTINCT dt.id) FILTER (WHERE dt.status IN ('assigned', 'accepted', 'in_transit'))::int AS in_progress_count,
        COALESCE(SUM(dc.received_quantity), 0)::numeric AS total_received_quantity,
        COALESCE(SUM(dc.damaged_quantity), 0)::numeric AS total_damaged_quantity,
        COALESCE(SUM(dc.missing_quantity), 0)::numeric AS total_missing_quantity
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      LEFT JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE ($1::uuid IS NULL OR b.donor_organisation_id = $1::uuid OR a.recipient_organisation_id = $1::uuid)
        AND ($2::timestamptz IS NULL OR dt.created_at >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR dt.created_at <= $3::timestamptz);
    `;

    const stats = (await this.db.queryOne<any>(deliverySql, [
      orgId,
      query.startDate || null,
      query.endDate || null,
    ])) || {
      total_deliveries: 0,
      delivered_count: 0,
      discrepancy_count: 0,
      cancelled_count: 0,
      in_progress_count: 0,
      total_received_quantity: 0,
      total_damaged_quantity: 0,
      total_missing_quantity: 0,
    };

    const completed =
      Number(stats.delivered_count) + Number(stats.discrepancy_count);
    const total = Number(stats.total_deliveries);
    const hasSufficientData = completed >= 3;

    // 2. Surplus waste patterns by category
    const patternSql = `
      SELECT
        b.category,
        COUNT(*)::int AS batch_count,
        COALESCE(SUM(b.quantity), 0)::numeric AS total_quantity,
        b.quantity_unit
      FROM public.food_batches b
      WHERE ($1::uuid IS NULL OR b.donor_organisation_id = $1::uuid)
        AND ($2::timestamptz IS NULL OR b.created_at >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR b.created_at <= $3::timestamptz)
      GROUP BY b.category, b.quantity_unit
      ORDER BY total_quantity DESC;
    `;

    const patterns = await this.db.query<any>(patternSql, [
      orgId,
      query.startDate || null,
      query.endDate || null,
    ]);

    return {
      dataType: 'measured_operational_data',
      scope: { organisationId: orgId, isPlatformWide: !orgId },
      reportingPeriod: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
      hasSufficientData,
      notice: hasSufficientData
        ? 'Real-time measured operational metrics from verified database records.'
        : 'Insufficient operational history to detect statistically significant trends (minimum 3 completed rescue operations required). Real-time telemetry is recorded and will update as operations scale.',
      deliveries: {
        total,
        completed,
        inProgress: Number(stats.in_progress_count),
        cancelled: Number(stats.cancelled_count),
        fulfillmentRatePercent:
          total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
        discrepancyRatePercent:
          completed > 0
            ? Number(
                ((Number(stats.discrepancy_count) / completed) * 100).toFixed(1),
              )
            : 0,
      },
      quantities: {
        receivedKg: Number(stats.total_received_quantity),
        damagedKg: Number(stats.total_damaged_quantity),
        missingKg: Number(stats.total_missing_quantity),
      },
      wastePatternsByCategory: patterns.map((p) => ({
        category: p.category || 'unclassified',
        batchCount: Number(p.batch_count),
        totalQuantity: Number(p.total_quantity),
        quantityUnit: p.quantity_unit,
      })),
    };
  }

  async getBottlenecks(user: AuthUser, requestedOrgId?: string): Promise<any> {
    const orgId = this.resolveScope(user, requestedOrgId);

    const bottleneckSql = `
      SELECT
        COUNT(*) FILTER (WHERE b.status = 'pending_inspection' AND b.created_at < now() - interval '24 hours')::int AS stale_uninspected_batches,
        COUNT(*) FILTER (WHERE b.status = 'hold')::int AS batches_on_hold,
        COUNT(*) FILTER (WHERE dt.status IN ('assigned', 'accepted') AND dt.created_at < now() - interval '24 hours')::int AS delayed_unpicked_deliveries,
        COUNT(*) FILTER (WHERE dt.status = 'in_transit' AND dt.pickup_confirmed_at < now() - interval '12 hours')::int AS delayed_in_transit_deliveries,
        ROUND(AVG(EXTRACT(EPOCH FROM (qi.inspected_at - b.created_at)) / 3600.0)::numeric, 1) AS avg_hours_to_inspect,
        ROUND(AVG(EXTRACT(EPOCH FROM (dt.pickup_confirmed_at - dt.created_at)) / 3600.0)::numeric, 1) AS avg_hours_to_pickup,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(dt.delivered_at, dt.updated_at) - dt.pickup_confirmed_at)) / 3600.0)::numeric, 1) AS avg_hours_in_transit
      FROM public.food_batches b
      LEFT JOIN public.quality_inspections qi ON qi.batch_id = b.id
      LEFT JOIN public.food_allocations a ON a.batch_id = b.id
      LEFT JOIN public.delivery_tasks dt ON dt.allocation_id = a.id
      WHERE ($1::uuid IS NULL OR b.donor_organisation_id = $1::uuid);
    `;

    const row = (await this.db.queryOne<any>(bottleneckSql, [orgId])) || {};

    return {
      dataType: 'measured_operational_data',
      scope: { organisationId: orgId, isPlatformWide: !orgId },
      activeBottlenecks: {
        staleUninspectedBatches: Number(row.stale_uninspected_batches || 0),
        batchesOnHold: Number(row.batches_on_hold || 0),
        delayedUnpickedDeliveries: Number(row.delayed_unpicked_deliveries || 0),
        delayedInTransitDeliveries: Number(row.delayed_in_transit_deliveries || 0),
      },
      leadTimesHours: {
        averageInspectionHours: row.avg_hours_to_inspect
          ? Number(row.avg_hours_to_inspect)
          : null,
        averagePickupHours: row.avg_hours_to_pickup
          ? Number(row.avg_hours_to_pickup)
          : null,
        averageTransitHours: row.avg_hours_in_transit
          ? Number(row.avg_hours_in_transit)
          : null,
      },
      diagnosticNotice:
        'Operational lead times calculated from verified database timestamps.',
    };
  }
}
