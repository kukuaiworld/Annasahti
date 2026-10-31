import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole, FoodBatchStatus, FoodCategory } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateFoodBatchDto } from './dto/create-food-batch.dto';
import { UpdateFoodBatchDto } from './dto/update-food-batch.dto';
import { BatchQueryDto } from './dto/batch-query.dto';
import { SplitBatchDto } from './dto/split-batch.dto';
import { randomBytes } from 'crypto';

export interface FoodBatchRecord {
  id: string;
  batch_code: string;
  donor_organisation_id: string;
  food_name: string;
  description?: string;
  category?: FoodCategory;
  quantity: number;
  quantity_unit: string;
  estimated_weight_kg?: number;
  prepared_at?: Date;
  best_before_at?: Date;
  pickup_deadline?: Date;
  storage_instructions?: string;
  status: FoodBatchStatus;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  parent_batch_id?: string;
  allocated_quantity: number;
  delivered_quantity: number;
  damaged_quantity: number;
  missing_quantity: number;
  available_quantity: number;
  donor_name?: string;
}

@Injectable()
export class FoodBatchesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safechain: SafeChainService,
  ) {}

  private generateBatchCode(): string {
    const randomHex = randomBytes(6).toString('hex').toUpperCase();
    return `FL-${randomHex}`;
  }

  /**
   * Phase 0 (Task B): server-side batch read-access policy.
   *
   * - ADMIN: platform-wide access (existing platform policy).
   * - INSPECTOR: batches in `pending_inspection`/`hold`, which is exactly the
   *   inspection workflow duty (queue is limited to those statuses).
   * - Members of an active organisation: batches of their donor organisation
   *   OR batches their organisation receives through an allocation.
   * - Volunteers: batches with a delivery task assigned to them.
   * - Everyone else (org-less non-inspectors): denied (concealed 404).
   *
   * The role/organisation used here come from the verified request context
   * (trusted database profile + active membership), never from client input.
   *
   * Public so the inspections module can reuse the same policy for
   * GET /inspections/batch/:batchId (Phase 0, Task E).
   */
  async isBatchReadableByUser(batchId: string, batch: { status: string }, user: AuthUser): Promise<boolean> {
    if (user.role === AppRole.ADMIN) {
      return true;
    }

    if (user.role === AppRole.INSPECTOR && ['pending_inspection', 'hold'].includes(batch.status)) {
      return true;
    }

    const params: any[] = [batchId];
    let paramIdx = 2;

    const clauses: string[] = [];

    if (user.organisationId) {
      // Org relationship: own donor batches + received-allocation batches
      clauses.push(`b.donor_organisation_id = $${paramIdx}`);
      params.push(user.organisationId);
      paramIdx++;
      clauses.push(
        `EXISTS (SELECT 1 FROM public.food_allocations fa WHERE fa.batch_id = b.id AND fa.recipient_organisation_id = $${paramIdx})`,
      );
      params.push(user.organisationId);
      paramIdx++;
    }

    if (user.role === AppRole.VOLUNTEER) {
      // Delivery relationship: a delivery task assigned to this volunteer
      clauses.push(
        `EXISTS (
          SELECT 1
          FROM public.delivery_tasks dt
          JOIN public.food_allocations fav ON fav.id = dt.allocation_id
          WHERE fav.batch_id = b.id AND dt.volunteer_id = $${paramIdx}
        )`,
      );
      params.push(user.id);
      paramIdx++;
    }

    if (clauses.length === 0) {
      return false;
    }

    const result = await this.db.queryOne<{ allowed: boolean }>(
      `
      SELECT (${clauses.join(' OR ')}) AS allowed
      FROM public.food_batches b
      WHERE b.id = $1;
      `,
      params,
    );

    return Boolean(result?.allowed);
  }

  async createBatch(dto: CreateFoodBatchDto, user: AuthUser): Promise<FoodBatchRecord> {
    // Authorization: User must be member of donor organisation or platform admin
    if (user.role !== AppRole.ADMIN && user.organisationId !== dto.donorOrganisationId) {
      throw new ForbiddenException('You can only create food batches for your own organisation.');
    }

    // Time validation
    if (dto.preparedAt && dto.bestBeforeAt) {
      if (new Date(dto.bestBeforeAt) < new Date(dto.preparedAt)) {
        throw new BadRequestException('Best before date cannot be before preparation date.');
      }
    }

    if (dto.pickupDeadline && dto.bestBeforeAt) {
      if (new Date(dto.pickupDeadline) > new Date(dto.bestBeforeAt)) {
        throw new BadRequestException('Pickup deadline cannot be after best before date.');
      }
    }

    const batchCode = this.generateBatchCode();

    const sql = `
      INSERT INTO public.food_batches (
        batch_code, donor_organisation_id, food_name, description,
        quantity, quantity_unit, estimated_weight_kg,
        prepared_at, best_before_at, pickup_deadline, storage_instructions,
        status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const values = [
      batchCode,
      dto.donorOrganisationId,
      dto.foodName,
      dto.description || null,
      dto.quantity,
      dto.quantityUnit,
      dto.estimatedWeightKg || null,
      dto.preparedAt ? new Date(dto.preparedAt) : null,
      dto.bestBeforeAt ? new Date(dto.bestBeforeAt) : null,
      dto.pickupDeadline ? new Date(dto.pickupDeadline) : null,
      dto.storageInstructions || null,
      FoodBatchStatus.PENDING_INSPECTION,
      user.id,
    ];

    // Atomic insert + audit event so a SafeChain failure cannot leave a batch
    // without traceability, and audit triggers observe the acting user.
    return this.db.transaction(async (client) => {
      const batch = (await client.query(sql, values)).rows[0] as FoodBatchRecord;

      // Record SafeChain audit event
      await this.safechain.recordEvent(
        {
          batchId: batch.id,
          eventType: 'batch_created',
          description: `Donation batch created by ${user.fullName}: ${batch.food_name} (${batch.quantity} ${batch.quantity_unit})`,
          recordedBy: user.id,
          eventData: {
            batchCode: batch.batch_code,
            donorOrganisationId: batch.donor_organisation_id,
            quantity: batch.quantity,
            quantityUnit: batch.quantity_unit,
          },
        },
        client,
      );

      return batch;
    }, user.id);
  }

  async getBatchById(id: string, user: AuthUser): Promise<any> {
    const batch = await this.db.queryOne<FoodBatchRecord>(
      `
      SELECT b.*, o.name as donor_name, o.address as donor_address, o.location as donor_location
      FROM public.food_batches b
      JOIN public.organisations o ON o.id = b.donor_organisation_id
      WHERE b.id = $1;
      `,
      [id],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    // Phase 0 (Task B): cross-tenant reads are concealed with 404 so the
    // existence of another organisation's batch is not revealed.
    if (!(await this.isBatchReadableByUser(id, { status: String(batch.status) }, user))) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    // Retrieve child batches if any
    const childBatches = await this.db.query<FoodBatchRecord>(
      `SELECT * FROM public.food_batches WHERE parent_batch_id = $1 ORDER BY created_at ASC;`,
      [id],
    );

    // Retrieve parent batch if this is a child
    let parentBatch: FoodBatchRecord | null = null;
    if (batch.parent_batch_id) {
      parentBatch = await this.db.queryOne<FoodBatchRecord>(
        `SELECT * FROM public.food_batches WHERE id = $1;`,
        [batch.parent_batch_id],
      );
    }

    // Retrieve inspection records
    const inspections = await this.db.query(
      `
      SELECT qi.*, p.full_name as inspector_name
      FROM public.quality_inspections qi
      JOIN public.profiles p ON p.id = qi.inspector_id
      WHERE qi.batch_id = $1
      ORDER BY qi.created_at DESC;
      `,
      [id],
    );

    return {
      ...batch,
      childBatches,
      parentBatch,
      inspections,
    };
  }

  async listBatches(query: BatchQueryDto, user: AuthUser): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    // Phase 0 (Task B): server-side tenant scoping. An explicit
    // donorOrganisationId filter can never override ownership.
    if (query.donorOrganisationId && user.role === AppRole.ADMIN) {
      whereClauses.push(`b.donor_organisation_id = $${paramIndex++}`);
      values.push(query.donorOrganisationId);
    } else if (user.role !== AppRole.ADMIN) {
      const scopeClauses: string[] = [];

      if (user.organisationId) {
        // Own donor organisation + batches the org receives through an allocation
        scopeClauses.push(`b.donor_organisation_id = $${paramIndex}`);
        values.push(user.organisationId);
        paramIndex++;
        scopeClauses.push(
          `EXISTS (SELECT 1 FROM public.food_allocations dfa WHERE dfa.batch_id = b.id AND dfa.recipient_organisation_id = $${paramIndex})`,
        );
        values.push(user.organisationId);
        paramIndex++;
      }

      if (user.role === AppRole.INSPECTOR) {
        // Inspection workflow duty: the queue covers pending/hold batches only.
        scopeClauses.push(`b.status IN ('pending_inspection'::public.food_batch_status, 'hold'::public.food_batch_status)`);
      }

      if (user.role === AppRole.VOLUNTEER) {
        scopeClauses.push(
          `EXISTS (
            SELECT 1
            FROM public.delivery_tasks dv
            JOIN public.food_allocations dva ON dva.id = dv.allocation_id
            WHERE dva.batch_id = b.id AND dv.volunteer_id = $${paramIndex}
          )`,
        );
        values.push(user.id);
        paramIndex++;
      }

      if (scopeClauses.length === 0) {
        // Org-less non-admin, non-inspector, non-volunteer: deliberate
        // default-deny instead of platform-wide data.
        whereClauses.push('1 = 0');
      } else {
        whereClauses.push(`(${scopeClauses.join(' OR ')})`);
      }
    }

    if (query.status) {
      whereClauses.push(`b.status = $${paramIndex++}`);
      values.push(query.status);
    }

    if (query.category) {
      whereClauses.push(`b.category = $${paramIndex++}`);
      values.push(query.category);
    }

    if (query.expiryAfter) {
      whereClauses.push(`(b.best_before_at IS NULL OR b.best_before_at >= $${paramIndex++})`);
      values.push(new Date(query.expiryAfter));
    }

    if (query.pickupBefore) {
      whereClauses.push(`(b.pickup_deadline IS NULL OR b.pickup_deadline <= $${paramIndex++})`);
      values.push(new Date(query.pickupBefore));
    }

    if (query.search) {
      whereClauses.push(`(b.food_name ILIKE $${paramIndex} OR b.batch_code ILIKE $${paramIndex})`);
      values.push(`%${query.search}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.join(' AND ');

    const countSql = `SELECT count(*)::int as total FROM public.food_batches b WHERE ${whereSql};`;
    const totalResult = await this.db.queryOne<{ total: number }>(countSql, values);
    const total = totalResult ? totalResult.total : 0;

    const dataSql = `
      SELECT b.*, o.name as donor_name, o.address as donor_address
      FROM public.food_batches b
      JOIN public.organisations o ON o.id = b.donor_organisation_id
      WHERE ${whereSql}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    values.push(limit, offset);

    const data = await this.db.query<FoodBatchRecord>(dataSql, values);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Phase 0 (Task F): GET /api/v1/batches/summary
   *
   * Donor-owned dashboard metrics, scoped strictly to the caller's own active
   * organisation (the caller cannot pass an arbitrary organisation id).
   *
   * Metric definitions (documented, no invented numbers):
   * - Batches are counted at top level only (parent_batch_id IS NULL) so parent
   *   and child quantities are never double counted. Child reservations are
   *   already included in the parent's allocated_quantity by the database
   *   quantity ledger (recalculate_batch_allocation_totals).
   * - originalQuantity  = SUM(quantity) over top-level batches — the amount the
   *   donor registered (child batches are derived, not additional registrations).
   * - reservedQuantity  = SUM(allocated_quantity) over top-level batches —
   *   active allocations plus non-cancelled child-batch reservations.
   * - availableQuantity = generated column SUM(available_quantity) over
   *   top-level batches = GREATEST(0, quantity - allocated - damaged - missing).
   * - lostQuantity      = SUM(damaged_quantity + missing_quantity) across all
   *   org batch rows (the delivery ledger records loss on the exact row the
   *   allocation targets, which may be a child batch).
   * - deliveredQuantity = SUM(delivered_quantity) across all org batch rows —
   *   recipient-confirmed received quantities maintained by the
   *   delivery-confirmation ledger (never claimed status counts).
   * - Quantities are broken down by unit; kg and portions are NEVER summed
   *   together.
   * Status counts use the database's own status enum values; `allocated`
   * combines 'allocated' and 'partially_allocated' as "has live reservations".
   */
  async getBatchSummary(user: AuthUser): Promise<any> {
    if (!user.organisationId) {
      throw new ForbiddenException(
        'Batch summary is scoped to your own organisation, but your account has no active organisation membership.',
      );
    }

    const organisationId = user.organisationId;

    const countRow = await this.db.queryOne<any>(
      `
      SELECT
        count(*)::int AS total_batches,
        count(*) FILTER (WHERE status = 'pending_inspection')::int AS pending_inspection,
        count(*) FILTER (WHERE status = 'hold')::int AS on_hold,
        count(*) FILTER (WHERE status = 'approved')::int AS approved,
        count(*) FILTER (WHERE status = 'partially_allocated')::int AS partially_allocated,
        count(*) FILTER (WHERE status = 'allocated')::int AS allocated,
        count(*) FILTER (WHERE status = 'in_transit')::int AS in_transit,
        count(*) FILTER (WHERE status = 'completed')::int AS completed,
        count(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        count(*) FILTER (WHERE status = 'expired')::int AS expired,
        count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
      FROM public.food_batches
      WHERE donor_organisation_id = $1
        AND parent_batch_id IS NULL;
      `,
      [organisationId],
    );

    const quantityRows = await this.db.query<any>(
      `
      SELECT
        b.quantity_unit AS unit,
        COALESCE(SUM(b.quantity) FILTER (WHERE b.parent_batch_id IS NULL), 0)::float8 AS original_quantity,
        COALESCE(SUM(b.allocated_quantity) FILTER (WHERE b.parent_batch_id IS NULL), 0)::float8 AS reserved_quantity,
        COALESCE(SUM(b.available_quantity) FILTER (WHERE b.parent_batch_id IS NULL), 0)::float8 AS available_quantity,
        COALESCE(SUM(b.delivered_quantity), 0)::float8 AS delivered_quantity,
        COALESCE(SUM(b.damaged_quantity + b.missing_quantity), 0)::float8 AS lost_quantity
      FROM public.food_batches b
      WHERE b.donor_organisation_id = $1
      GROUP BY b.quantity_unit
      ORDER BY b.quantity_unit ASC;
      `,
      [organisationId],
    );

    return {
      organisationId,
      metrics: {
        totalBatches: countRow ? Number(countRow.total_batches) : 0,
        pendingInspection: countRow ? Number(countRow.pending_inspection) : 0,
        onHold: countRow ? Number(countRow.on_hold) : 0,
        approved: countRow ? Number(countRow.approved) : 0,
        partiallyAllocated: countRow ? Number(countRow.partially_allocated) : 0,
        allocated: countRow ? Number(countRow.allocated) : 0,
        inTransit: countRow ? Number(countRow.in_transit) : 0,
        completedBatches: countRow ? Number(countRow.completed) : 0,
        rejected: countRow ? Number(countRow.rejected) : 0,
        expired: countRow ? Number(countRow.expired) : 0,
        cancelled: countRow ? Number(countRow.cancelled) : 0,
        // Per-unit quantity accounting; units are never mixed.
        quantities: quantityRows.map((row) => ({
          unit: row.unit,
          originalQuantity: Number(row.original_quantity),
          reservedQuantity: Number(row.reserved_quantity),
          availableQuantity: Number(row.available_quantity),
          lostQuantity: Number(row.lost_quantity),
          deliveredQuantity: Number(row.delivered_quantity),
        })),
      },
    };
  }

  /**
   * Phase 0 (Task B): SafeChain history is tenant-protected — the caller must
   * be able to read the batch itself before reading its audit trail.
   */
  async getBatchHistory(id: string, user: AuthUser): Promise<any> {
    const batch = await this.db.queryOne<FoodBatchRecord>(
      `SELECT id, status, donor_organisation_id FROM public.food_batches WHERE id = $1;`,
      [id],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    if (!(await this.isBatchReadableByUser(id, { status: String(batch.status) }, user))) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    return this.safechain.getBatchEvents(id);
  }

  async updateBatch(id: string, dto: UpdateFoodBatchDto, user: AuthUser): Promise<FoodBatchRecord> {
    const batch = await this.db.queryOne<FoodBatchRecord>(
      `SELECT * FROM public.food_batches WHERE id = $1;`,
      [id],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    // Permission check
    if (user.role !== AppRole.ADMIN && user.organisationId !== batch.donor_organisation_id) {
      throw new ForbiddenException('You can only update food batches belonging to your organisation.');
    }

    // Invariant check: Only unallocated / pending / hold batches can be modified
    if (![FoodBatchStatus.PENDING_INSPECTION, FoodBatchStatus.HOLD, FoodBatchStatus.APPROVED].includes(batch.status)) {
      throw new BadRequestException(
        `Batches in status "${batch.status}" cannot be modified once in progress or distributed.`,
      );
    }

    const updates: string[] = ['updated_at = now()'];
    const values: any[] = [id];
    let idx = 2;

    if (dto.foodName !== undefined) {
      updates.push(`food_name = $${idx++}`);
      values.push(dto.foodName);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(dto.description);
    }
    if (dto.quantity !== undefined) {
      updates.push(`quantity = $${idx++}`);
      values.push(dto.quantity);
    }
    if (dto.estimatedWeightKg !== undefined) {
      updates.push(`estimated_weight_kg = $${idx++}`);
      values.push(dto.estimatedWeightKg);
    }
    if (dto.storageInstructions !== undefined) {
      updates.push(`storage_instructions = $${idx++}`);
      values.push(dto.storageInstructions);
    }
    if (dto.bestBeforeAt !== undefined) {
      updates.push(`best_before_at = $${idx++}`);
      values.push(new Date(dto.bestBeforeAt));
    }
    if (dto.pickupDeadline !== undefined) {
      updates.push(`pickup_deadline = $${idx++}`);
      values.push(new Date(dto.pickupDeadline));
    }

    const updateSql = `
      UPDATE public.food_batches
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    return this.db.transaction(async (client) => {
      const updatedBatch = (await client.query(updateSql, values)).rows[0] as FoodBatchRecord;

      await this.safechain.recordEvent(
        {
          batchId: id,
          eventType: 'batch_updated',
          description: `Food batch updated by ${user.fullName}`,
          recordedBy: user.id,
          eventData: { updatedFields: Object.keys(dto) },
        },
        client,
      );

      return updatedBatch;
    }, user.id);
  }

  async cancelBatch(id: string, reason: string, user: AuthUser): Promise<FoodBatchRecord> {
    const batch = await this.db.queryOne<FoodBatchRecord>(
      `SELECT * FROM public.food_batches WHERE id = $1;`,
      [id],
    );

    if (!batch) {
      throw new NotFoundException(`Food batch with ID "${id}" was not found.`);
    }

    if (user.role !== AppRole.ADMIN && user.organisationId !== batch.donor_organisation_id) {
      throw new ForbiddenException('You can only cancel batches belonging to your organisation.');
    }

    if ([FoodBatchStatus.IN_TRANSIT, FoodBatchStatus.COMPLETED].includes(batch.status)) {
      throw new BadRequestException(`Cannot cancel a batch that is in transit or completed.`);
    }

    return this.db.transaction(async (client) => {
      const updated = (await client.query(
        `
        UPDATE public.food_batches
        SET status = 'cancelled'::public.food_batch_status, updated_at = now()
        WHERE id = $1
        RETURNING *;
        `,
        [id],
      )).rows[0] as FoodBatchRecord;

      await this.safechain.recordEvent(
        {
          batchId: id,
          eventType: 'batch_cancelled',
          description: `Batch cancelled by ${user.fullName}. Reason: ${reason || 'Not specified'}`,
          recordedBy: user.id,
          eventData: { cancellationReason: reason },
        },
        client,
      );

      return updated;
    }, user.id);
  }

  /**
   * Controlled parent-child batch splitting.
   * Atomically divides an available parent batch into multiple child batches
   * for distinct destinations (Human, Animal, Waste) without quantity leakage.
   */
  async splitBatch(parentBatchId: string, dto: SplitBatchDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      const parentRes = await client.query(
        `SELECT * FROM public.food_batches WHERE id = $1 FOR UPDATE;`,
        [parentBatchId],
      );

      if (parentRes.rows.length === 0) {
        throw new NotFoundException(`Parent food batch with ID "${parentBatchId}" was not found.`);
      }

      const parent: FoodBatchRecord = parentRes.rows[0];

      // 2. Authorization check
      if (
        user.role !== AppRole.ADMIN &&
        user.role !== AppRole.INSPECTOR &&
        user.organisationId !== parent.donor_organisation_id
      ) {
        throw new ForbiddenException('You do not have authorization to split this food batch.');
      }

      // 3. Eligibility check
      if ([FoodBatchStatus.CANCELLED, FoodBatchStatus.EXPIRED, FoodBatchStatus.REJECTED].includes(parent.status)) {
        throw new BadRequestException(
          `Cannot split batch in "${parent.status}" status. Only approved or active batches can be split.`,
        );
      }

      // 4. Calculate total requested child quantity and validate unit compatibility
      let totalChildQty = 0;
      for (const child of dto.children) {
        if (child.quantityUnit !== parent.quantity_unit) {
          throw new BadRequestException(
            `Incompatible unit: Child batch requested unit "${child.quantityUnit}", but parent batch is measured in "${parent.quantity_unit}".`,
          );
        }

        // Species requirement check
        if (child.targetCategory === FoodCategory.ANIMAL_APPROPRIATE) {
          if (!child.targetSpecies || child.targetSpecies.length === 0) {
            throw new BadRequestException(
              'Species-specific suitability required: When splitting to an animal-appropriate route, targetSpecies must be specified.',
            );
          }
        }

        totalChildQty += Number(child.quantity);
      }

      // Calculate actual available balance
      const availableBalance = Number(parent.available_quantity ?? (
        Number(parent.quantity) - Number(parent.allocated_quantity) - Number(parent.damaged_quantity) - Number(parent.missing_quantity)
      ));

      if (totalChildQty > availableBalance) {
        throw new BadRequestException(
          `QUANTITY LEAK PREVENTED: Total child quantities (${totalChildQty} ${parent.quantity_unit}) exceed available parent batch balance (${availableBalance} ${parent.quantity_unit}).`,
        );
      }

      // 5. Create each child batch linked to parent
      const createdChildren: FoodBatchRecord[] = [];

      for (const child of dto.children) {
        const childCode = this.generateBatchCode();
        const childSql = `
          INSERT INTO public.food_batches (
            batch_code, parent_batch_id, donor_organisation_id, food_name, description,
            quantity, quantity_unit, category,
            prepared_at, best_before_at, pickup_deadline, storage_instructions,
            status, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `;

        const childValues = [
          childCode,
          parent.id,
          parent.donor_organisation_id,
          child.foodName || `${parent.food_name} (Split)`,
          `Split from Parent ${parent.batch_code}. ${dto.reason}`,
          child.quantity,
          child.quantityUnit,
          child.targetCategory,
          parent.prepared_at,
          child.bestBeforeAt ? new Date(child.bestBeforeAt) : parent.best_before_at,
          child.pickupDeadline ? new Date(child.pickupDeadline) : parent.pickup_deadline,
          child.storageInstructions || parent.storage_instructions,
          // FOOD SAFETY: child batches are never pre-approved. Splitting into a
          // destination route (human/animal/waste) requires a certified human
          // inspection of the child batch before it can be approved or allocated.
          FoodBatchStatus.PENDING_INSPECTION,
          user.id,
        ];

        const childRes = await client.query(childSql, childValues);
        const childRecord: FoodBatchRecord = childRes.rows[0];
        createdChildren.push(childRecord);

        // Record SafeChain event on child batch
        await this.safechain.recordEvent(
          {
            batchId: childRecord.id,
            eventType: 'child_batch_created',
            description: `Child batch ${childRecord.batch_code} created via split from ${parent.batch_code} (${childRecord.quantity} ${childRecord.quantity_unit} -> ${child.targetCategory})`,
            recordedBy: user.id,
            eventData: {
              parentBatchId: parent.id,
              parentBatchCode: parent.batch_code,
              targetCategory: child.targetCategory,
              targetSpecies: child.targetSpecies || null,
              splitReason: dto.reason,
            },
          },
          client,
        );
      }

      // 6. Parent ledger is NOT manually updated here (BUG-04 fix).
      // The child INSERT trigger (refresh_reservation_on_batch_change) already
      // recalculated the parent's allocated_quantity (allocations + child
      // reservation) and its status through recalculate_batch_allocation_totals().
      // The TypeScript-side increment previously desynced from the database's
      // authoritative recalculation performed by refresh_batch_allocation_status().

      // 7. Record parent batch SafeChain event
      await this.safechain.recordEvent(
        {
          batchId: parent.id,
          eventType: 'parent_batch_split',
          description: `Parent batch split into ${createdChildren.length} child batches (Total split: ${totalChildQty} ${parent.quantity_unit}) by ${user.fullName}`,
          recordedBy: user.id,
          eventData: {
            reason: dto.reason,
            idempotencyKey: dto.idempotencyKey || null,
            childBatchCodes: createdChildren.map((c) => c.batch_code),
            totalSplitQuantity: totalChildQty,
            remainingAvailableQuantity: availableBalance - totalChildQty,
          },
        },
        client,
      );

      return {
        message: 'Batch successfully split into traceable child batches.',
        parentBatchId: parent.id,
        totalSplitQuantity: totalChildQty,
        remainingParentAvailableQuantity: availableBalance - totalChildQty,
        children: createdChildren,
      };
    }, user.id);
  }
}
