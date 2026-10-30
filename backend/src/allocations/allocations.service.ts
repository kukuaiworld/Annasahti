import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole, FoodBatchStatus } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { AllocationQueryDto } from './dto/allocation-query.dto';

export interface FoodAllocationRecord {
  id: string;
  batch_id: string;
  recipient_organisation_id: string;
  allocated_quantity: number;
  quantity_unit: string;
  status: string;
  allocated_by?: string;
  accepted_at?: Date;
  created_at: Date;
  updated_at: Date;
  food_name?: string;
  batch_code?: string;
  recipient_name?: string;
  donor_name?: string;
}

@Injectable()
export class AllocationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safechain: SafeChainService,
  ) {}

  async createAllocation(dto: CreateAllocationDto, user: AuthUser): Promise<any> {
    return this.db.transaction(async (client) => {
      // 1. Concurrency protection: Lock batch row for update
      const batchRes = await client.query(
        `
        SELECT b.*, o.name as donor_name
        FROM public.food_batches b
        JOIN public.organisations o ON o.id = b.donor_organisation_id
        WHERE b.id = $1
        FOR UPDATE;
        `,
        [dto.batchId],
      );

      if (batchRes.rows.length === 0) {
        throw new NotFoundException(`Food batch with ID "${dto.batchId}" was not found.`);
      }

      const batch = batchRes.rows[0];

      // 2. Permission check: Only donor organisation members or admins can allocate
      if (user.role !== AppRole.ADMIN && user.organisationId !== batch.donor_organisation_id) {
        throw new ForbiddenException('You can only create allocations for batches belonging to your organisation.');
      }

      // 3. Batch eligibility check: Must be approved or partially allocated
      if (![FoodBatchStatus.APPROVED, FoodBatchStatus.PARTIALLY_ALLOCATED].includes(batch.status)) {
        throw new BadRequestException(
          `SAFETY FILTER: Batch "${batch.batch_code}" is currently in status "${batch.status}". Only approved batches can be allocated.`,
        );
      }

      if (!batch.category) {
        throw new BadRequestException('Batch has no destination category assigned. Quality inspection required.');
      }

      // 4. Unit compatibility
      if (dto.quantityUnit !== batch.quantity_unit) {
        throw new BadRequestException(
          `Incompatible unit: Allocation requested in "${dto.quantityUnit}", but batch is measured in "${batch.quantity_unit}".`,
        );
      }

      // 5. Quantity validation: Calculate authoritative available quantity
      const available = Number(batch.available_quantity ?? (
        Number(batch.quantity) - Number(batch.allocated_quantity) - Number(batch.damaged_quantity) - Number(batch.missing_quantity)
      ));

      if (Number(dto.allocatedQuantity) > available) {
        throw new BadRequestException(
          `DOUBLE-ALLOCATION PREVENTED: Requested allocation (${dto.allocatedQuantity} ${dto.quantityUnit}) exceeds available batch balance (${available} ${batch.quantity_unit}).`,
        );
      }

      // 6. Recipient verification
      const recipient = await client.query(
        `SELECT id, name, verification_status, organisation_type FROM public.organisations WHERE id = $1;`,
        [dto.recipientOrganisationId],
      );

      if (recipient.rows.length === 0) {
        throw new NotFoundException(`Recipient organisation with ID "${dto.recipientOrganisationId}" was not found.`);
      }

      if (recipient.rows[0].verification_status !== 'verified') {
        throw new BadRequestException(
          `Recipient organisation "${recipient.rows[0].name}" is not verified (status: ${recipient.rows[0].verification_status}).`,
        );
      }

      // 7. Insert allocation record
      const allocInsertSql = `
        INSERT INTO public.food_allocations (
          batch_id, recipient_organisation_id, allocated_quantity,
          quantity_unit, status, allocated_by
        )
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING *;
      `;

      const allocValues = [
        dto.batchId,
        dto.recipientOrganisationId,
        dto.allocatedQuantity,
        dto.quantityUnit,
        user.id,
      ];

      const allocRes = await client.query(allocInsertSql, allocValues);
      const allocation: FoodAllocationRecord = allocRes.rows[0];

      // 8. Automatically initialize linked delivery task
      const deliveryTaskSql = `
        INSERT INTO public.delivery_tasks (
          allocation_id, status, pickup_deadline, delivery_deadline
        )
        VALUES ($1, 'assigned', $2, $3)
        RETURNING *;
      `;

      const deliveryTaskRes = await client.query(deliveryTaskSql, [
        allocation.id,
        batch.pickup_deadline,
        batch.best_before_at,
      ]);
      const deliveryTask = deliveryTaskRes.rows[0];

      // 9. Record SafeChain audit event
      await this.safechain.recordEvent(
        {
          batchId: batch.id,
          allocationId: allocation.id,
          eventType: 'allocation_created',
          description: `Allocation of ${allocation.allocated_quantity} ${allocation.quantity_unit} reserved for ${recipient.rows[0].name} by ${user.fullName}`,
          recordedBy: user.id,
          eventData: {
            allocationId: allocation.id,
            recipientOrganisationId: allocation.recipient_organisation_id,
            allocatedQuantity: allocation.allocated_quantity,
            quantityUnit: allocation.quantity_unit,
            deliveryTaskId: deliveryTask.id,
          },
        },
        client,
      );

      return {
        message: 'Food allocation successfully created and inventory reserved.',
        allocation,
        deliveryTask,
      };
    });
  }

  async getAllocationById(id: string, user: AuthUser): Promise<any> {
    const allocation = await this.db.queryOne<FoodAllocationRecord>(
      `
      SELECT 
        a.*,
        b.food_name,
        b.batch_code,
        b.category as batch_category,
        b.donor_organisation_id,
        donor.name as donor_name,
        donor.address as donor_address,
        ro.name as recipient_name,
        ro.address as recipient_address
      FROM public.food_allocations a
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      WHERE a.id = $1;
      `,
      [id],
    );

    if (!allocation) {
      throw new NotFoundException(`Food allocation with ID "${id}" was not found.`);
    }

    // Role check: Only donor, recipient, assigned volunteer, or admin can inspect
    const isDonorMember = user.organisationId === (allocation as any).donor_organisation_id;
    const isRecipientMember = user.organisationId === allocation.recipient_organisation_id;
    const isAdmin = user.role === AppRole.ADMIN;

    if (!isDonorMember && !isRecipientMember && !isAdmin && user.role !== AppRole.VOLUNTEER) {
      throw new ForbiddenException('You do not have permission to view this allocation.');
    }

    const deliveryTasks = await this.db.query(
      `
      SELECT dt.*, p.full_name as volunteer_name, p.phone as volunteer_phone
      FROM public.delivery_tasks dt
      LEFT JOIN public.profiles p ON p.id = dt.volunteer_id
      WHERE dt.allocation_id = $1
      ORDER BY dt.created_at ASC;
      `,
      [id],
    );

    return {
      ...allocation,
      deliveryTasks,
    };
  }

  async listAllocations(query: AllocationQueryDto, user: AuthUser): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let pIdx = 1;

    // Tenant isolation: non-admins only see allocations relating to their organisation
    if (user.role !== AppRole.ADMIN) {
      if (user.organisationId) {
        whereClauses.push(
          `(a.recipient_organisation_id = $${pIdx} OR b.donor_organisation_id = $${pIdx})`,
        );
        values.push(user.organisationId);
        pIdx++;
      } else if (user.role === AppRole.VOLUNTEER) {
        whereClauses.push(
          `EXISTS (SELECT 1 FROM public.delivery_tasks dt WHERE dt.allocation_id = a.id AND dt.volunteer_id = $${pIdx})`,
        );
        values.push(user.id);
        pIdx++;
      }
    }

    if (query.status) {
      whereClauses.push(`a.status = $${pIdx++}`);
      values.push(query.status);
    }

    if (query.batchId) {
      whereClauses.push(`a.batch_id = $${pIdx++}`);
      values.push(query.batchId);
    }

    if (query.recipientOrganisationId) {
      whereClauses.push(`a.recipient_organisation_id = $${pIdx++}`);
      values.push(query.recipientOrganisationId);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await this.db.queryOne<{ total: number }>(
      `
      SELECT count(*)::int as total
      FROM public.food_allocations a
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE ${whereSql};
      `,
      values,
    );
    const total = countRes ? countRes.total : 0;

    const dataSql = `
      SELECT 
        a.*,
        b.food_name,
        b.batch_code,
        b.category as batch_category,
        donor.name as donor_name,
        ro.name as recipient_name
      FROM public.food_allocations a
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      WHERE ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;
    values.push(limit, offset);

    const data = await this.db.query(dataSql, values);

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

  async acceptAllocation(id: string, user: AuthUser): Promise<any> {
    const allocation = await this.db.queryOne<FoodAllocationRecord>(
      `SELECT * FROM public.food_allocations WHERE id = $1;`,
      [id],
    );

    if (!allocation) {
      throw new NotFoundException(`Food allocation with ID "${id}" was not found.`);
    }

    if (user.role !== AppRole.ADMIN && user.organisationId !== allocation.recipient_organisation_id) {
      throw new ForbiddenException('Only authorized members of the recipient organisation can accept allocations.');
    }

    if (allocation.status !== 'pending') {
      throw new BadRequestException(`Cannot accept allocation currently in "${allocation.status}" status.`);
    }

    const updated = (await this.db.queryOne<FoodAllocationRecord>(
      `
      UPDATE public.food_allocations
      SET status = 'accepted'::public.allocation_status, accepted_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    ))!;

    await this.safechain.recordEvent({
      batchId: allocation.batch_id,
      allocationId: id,
      eventType: 'allocation_accepted',
      description: `Allocation of ${allocation.allocated_quantity} ${allocation.quantity_unit} accepted by recipient`,
      recordedBy: user.id,
      eventData: { allocationId: id },
    });

    return {
      message: 'Allocation accepted successfully.',
      allocation: updated,
    };
  }

  async rejectAllocation(id: string, reason: string, user: AuthUser): Promise<any> {
    const allocation = await this.db.queryOne<FoodAllocationRecord>(
      `SELECT * FROM public.food_allocations WHERE id = $1;`,
      [id],
    );

    if (!allocation) {
      throw new NotFoundException(`Food allocation with ID "${id}" was not found.`);
    }

    if (user.role !== AppRole.ADMIN && user.organisationId !== allocation.recipient_organisation_id) {
      throw new ForbiddenException('Only members of the recipient organisation can reject this allocation.');
    }

    if (allocation.status !== 'pending') {
      throw new BadRequestException(`Cannot reject an allocation in "${allocation.status}" status.`);
    }

    // Cancel allocation - Trigger automatically releases reserved batch stock!
    const updated = (await this.db.queryOne<FoodAllocationRecord>(
      `
      UPDATE public.food_allocations
      SET status = 'cancelled'::public.allocation_status, updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    ))!;

    // Cancel linked un-dispatched delivery tasks
    await this.db.query(
      `
      UPDATE public.delivery_tasks
      SET status = 'cancelled'::public.delivery_status, updated_at = now()
      WHERE allocation_id = $1 AND status IN ('assigned', 'accepted');
      `,
      [id],
    );

    await this.safechain.recordEvent({
      batchId: allocation.batch_id,
      allocationId: id,
      eventType: 'allocation_rejected',
      description: `Allocation rejected by recipient: ${reason}. Reserved stock released back to batch balance.`,
      recordedBy: user.id,
      eventData: { allocationId: id, rejectionReason: reason },
    });

    return {
      message: 'Allocation rejected and stock released back to batch.',
      allocation: updated,
    };
  }

  async cancelAllocation(id: string, reason: string, user: AuthUser): Promise<any> {
    const allocation = await this.db.queryOne<FoodAllocationRecord>(
      `
      SELECT a.*, b.donor_organisation_id
      FROM public.food_allocations a
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE a.id = $1;
      `,
      [id],
    );

    if (!allocation) {
      throw new NotFoundException(`Food allocation with ID "${id}" was not found.`);
    }

    if (user.role !== AppRole.ADMIN && user.organisationId !== (allocation as any).donor_organisation_id) {
      throw new ForbiddenException('Only donor organisation members or admins can cancel this allocation.');
    }

    if (['fulfilled', 'cancelled', 'expired'].includes(allocation.status)) {
      throw new BadRequestException(`Cannot cancel allocation in "${allocation.status}" status.`);
    }

    const updated = (await this.db.queryOne<FoodAllocationRecord>(
      `
      UPDATE public.food_allocations
      SET status = 'cancelled'::public.allocation_status, updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    ))!;

    await this.db.query(
      `
      UPDATE public.delivery_tasks
      SET status = 'cancelled'::public.delivery_status, updated_at = now()
      WHERE allocation_id = $1 AND status IN ('assigned', 'accepted');
      `,
      [id],
    );

    await this.safechain.recordEvent({
      batchId: allocation.batch_id,
      allocationId: id,
      eventType: 'allocation_cancelled',
      description: `Allocation cancelled by donor/admin: ${reason}. Reserved quantity released.`,
      recordedBy: user.id,
      eventData: { allocationId: id, cancellationReason: reason },
    });

    return {
      message: 'Allocation cancelled and inventory released.',
      allocation: updated,
    };
  }
}
