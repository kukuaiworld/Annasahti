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

    const batch = (await this.db.queryOne<FoodBatchRecord>(sql, values))!;

    // Record SafeChain audit event
    await this.safechain.recordEvent({
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
    });

    return batch;
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

    if (query.status) {
      whereClauses.push(`b.status = $${paramIndex++}`);
      values.push(query.status);
    }

    if (query.category) {
      whereClauses.push(`b.category = $${paramIndex++}`);
      values.push(query.category);
    }

    if (query.donorOrganisationId) {
      whereClauses.push(`b.donor_organisation_id = $${paramIndex++}`);
      values.push(query.donorOrganisationId);
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

    const updatedBatch = (await this.db.queryOne<FoodBatchRecord>(updateSql, values))!;

    await this.safechain.recordEvent({
      batchId: id,
      eventType: 'batch_updated',
      description: `Food batch updated by ${user.fullName}`,
      recordedBy: user.id,
      eventData: { updatedFields: Object.keys(dto) },
    });

    return updatedBatch;
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

    const updated = (await this.db.queryOne<FoodBatchRecord>(
      `
      UPDATE public.food_batches
      SET status = 'cancelled'::public.food_batch_status, updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    ))!;

    await this.safechain.recordEvent({
      batchId: id,
      eventType: 'batch_cancelled',
      description: `Batch cancelled by ${user.fullName}. Reason: ${reason || 'Not specified'}`,
      recordedBy: user.id,
      eventData: { cancellationReason: reason },
    });

    return updated;
  }

  /**
   * Controlled parent-child batch splitting.
   * Atomically divides an available parent batch into multiple child batches
   * for distinct destinations (Human, Animal, Waste) without quantity leakage.
   */
  async splitBatch(parentBatchId: string, dto: SplitBatchDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      // 1. Lock parent batch row for update
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
          FoodBatchStatus.APPROVED, // Child batch is approved for this specific destination route
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

      // 6. Update parent batch: reserve split quantity as allocated and update status
      const newAllocated = Number(parent.allocated_quantity || 0) + totalChildQty;
      const isFullySplit = (availableBalance - totalChildQty) <= 0.0001;
      const newParentStatus = isFullySplit
        ? FoodBatchStatus.ALLOCATED
        : FoodBatchStatus.PARTIALLY_ALLOCATED;

      await client.query(
        `
        UPDATE public.food_batches
        SET 
          allocated_quantity = $1,
          status = $2::public.food_batch_status,
          updated_at = now()
        WHERE id = $3;
        `,
        [newAllocated, newParentStatus, parent.id],
      );

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
    });
  }
}
