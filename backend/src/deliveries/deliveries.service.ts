import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SafeChainService } from '../safechain/safechain.service';
import { AppRole } from '../common/enums/app.enums';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AssignVolunteerDto } from './dto/assign-volunteer.dto';
import { ReassignVolunteerDto } from './dto/reassign-volunteer.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';
import { PickupDeliveryDto } from './dto/pickup-delivery.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { DeliveryQueryDto } from './dto/delivery-query.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly safechain: SafeChainService,
  ) {}

  async assignVolunteer(taskId: string, dto: AssignVolunteerDto, user: AuthUser): Promise<any> {
    const task = await this.db.queryOne(
      `
      SELECT dt.*, a.batch_id, a.recipient_organisation_id, b.donor_organisation_id
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (['delivered', 'cancelled', 'failed'].includes(task.status)) {
      throw new BadRequestException(`Cannot assign volunteer to task in "${task.status}" status.`);
    }

    // Verify volunteer profile
    const volunteer = await this.db.queryOne(
      `SELECT id, full_name, role FROM public.profiles WHERE id = $1;`,
      [dto.volunteerId],
    );

    if (!volunteer) {
      throw new NotFoundException(`Volunteer profile with ID "${dto.volunteerId}" was not found.`);
    }

    const updatedTask = (await this.db.queryOne(
      `
      UPDATE public.delivery_tasks
      SET 
        volunteer_id = $1,
        status = 'accepted'::public.delivery_status,
        pickup_deadline = COALESCE($2, pickup_deadline),
        delivery_deadline = COALESCE($3, delivery_deadline),
        delivery_notes = COALESCE($4, delivery_notes),
        accepted_at = now(),
        updated_at = now()
      WHERE id = $5
      RETURNING *;
      `,
      [
        dto.volunteerId,
        dto.pickupDeadline ? new Date(dto.pickupDeadline) : null,
        dto.deliveryDeadline ? new Date(dto.deliveryDeadline) : null,
        dto.deliveryNotes || null,
        taskId,
      ],
    ))!;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: 'volunteer_assigned',
      description: `Delivery assigned to volunteer ${volunteer.full_name} by ${user.fullName}`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        volunteerId: dto.volunteerId,
        volunteerName: volunteer.full_name,
      },
    });

    return {
      message: 'Volunteer successfully assigned to delivery.',
      deliveryTask: updatedTask,
    };
  }

  async reassignVolunteer(taskId: string, dto: ReassignVolunteerDto, user: AuthUser): Promise<any> {
    const task = await this.db.queryOne(
      `
      SELECT dt.*, a.batch_id
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (['delivered', 'cancelled', 'failed'].includes(task.status)) {
      throw new BadRequestException(`Cannot reassign task in "${task.status}" status.`);
    }

    const previousVolunteerId = task.volunteer_id;

    // Verify new volunteer profile
    const newVolunteer = await this.db.queryOne(
      `SELECT id, full_name FROM public.profiles WHERE id = $1;`,
      [dto.newVolunteerId],
    );

    if (!newVolunteer) {
      throw new NotFoundException(`New volunteer with ID "${dto.newVolunteerId}" was not found.`);
    }

    const updatedTask = (await this.db.queryOne(
      `
      UPDATE public.delivery_tasks
      SET 
        volunteer_id = $1,
        delivery_notes = COALESCE(delivery_notes || E'\n' || $2, $2),
        updated_at = now()
      WHERE id = $3
      RETURNING *;
      `,
      [
        dto.newVolunteerId,
        `Reassigned: ${dto.reason}`,
        taskId,
      ],
    ))!;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: 'volunteer_reassigned',
      description: `Delivery reassigned to volunteer ${newVolunteer.full_name}. Reason: ${dto.reason}`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        previousVolunteerId,
        newVolunteerId: dto.newVolunteerId,
        reason: dto.reason,
      },
    });

    return {
      message: 'Volunteer reassigned successfully.',
      deliveryTask: updatedTask,
    };
  }

  async cancelDelivery(taskId: string, dto: CancelDeliveryDto, user: AuthUser): Promise<any> {
    const task = await this.db.queryOne(
      `
      SELECT dt.*, a.batch_id
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (task.status === 'delivered') {
      throw new BadRequestException('Cannot cancel a delivery that has already been confirmed as delivered.');
    }

    const updatedTask = (await this.db.queryOne(
      `
      UPDATE public.delivery_tasks
      SET 
        status = 'cancelled'::public.delivery_status,
        delivery_notes = COALESCE(delivery_notes || E'\n' || $1, $1),
        updated_at = now()
      WHERE id = $2
      RETURNING *;
      `,
      [`Cancelled: ${dto.reason}`, taskId],
    ))!;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: 'delivery_cancelled',
      description: `Delivery cancelled by ${user.fullName}. Reason: ${dto.reason}`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        reason: dto.reason,
      },
    });

    return {
      message: 'Delivery cancelled successfully.',
      deliveryTask: updatedTask,
    };
  }

  async recordPickup(taskId: string, dto: PickupDeliveryDto, user: AuthUser): Promise<any> {
    const task = await this.db.queryOne(
      `
      SELECT dt.*, a.batch_id
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    // Permission check: Assigned volunteer or admin
    if (user.role !== AppRole.ADMIN && user.id !== task.volunteer_id) {
      throw new ForbiddenException('Only the assigned volunteer can record pickup for this delivery.');
    }

    if (['delivered', 'cancelled', 'failed'].includes(task.status)) {
      throw new BadRequestException(`Cannot record pickup for delivery in "${task.status}" status.`);
    }

    const updatedTask = (await this.db.queryOne(
      `
      UPDATE public.delivery_tasks
      SET 
        status = 'in_transit'::public.delivery_status,
        pickup_confirmed_at = now(),
        departed_at = now(),
        delivery_notes = COALESCE(delivery_notes || E'\n' || $1, delivery_notes),
        updated_at = now()
      WHERE id = $2
      RETURNING *;
      `,
      [dto.pickupNotes ? `Pickup note: ${dto.pickupNotes}` : null, taskId],
    ))!;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: 'pickup_confirmed',
      description: `Volunteer ${user.fullName} confirmed pickup. Batch is now in transit.`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        pickupNotes: dto.pickupNotes || null,
      },
    });

    return {
      message: 'Pickup milestone recorded. Delivery is now in transit.',
      deliveryTask: updatedTask,
    };
  }

  async completeDelivery(taskId: string, dto: CompleteDeliveryDto, user: AuthUser): Promise<any> {
    const task = await this.db.queryOne(
      `
      SELECT 
        dt.*,
        a.batch_id,
        a.allocated_quantity,
        a.quantity_unit,
        a.recipient_organisation_id,
        b.donor_organisation_id
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!task) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    if (task.status === 'delivered') {
      throw new BadRequestException('This delivery has already been confirmed.');
    }

    if (dto.quantityUnit !== task.quantity_unit) {
      throw new BadRequestException(
        `Quantity unit mismatch: Confirmation provided in "${dto.quantityUnit}", but delivery task requires "${task.quantity_unit}".`,
      );
    }

    const received = Number(dto.receivedQuantity);
    const damaged = Number(dto.damagedQuantity ?? 0);
    const missing = Number(dto.missingQuantity ?? 0);
    const allocated = Number(task.allocated_quantity);

    if (Math.abs(received + damaged + missing - allocated) > 0.001) {
      throw new BadRequestException(
        `ACCOUNTING RECONCILIATION FAILED: Sum of received (${received}), damaged (${damaged}), and missing (${missing}) must equal allocated quantity (${allocated} ${task.quantity_unit}).`,
      );
    }

    // Insert into delivery_confirmations (Triggers validate quantities, update task, update batch loss)
    const confirmationSql = `
      INSERT INTO public.delivery_confirmations (
        delivery_task_id, confirmed_by, received_quantity,
        damaged_quantity, missing_quantity, quantity_unit,
        recipient_notes, evidence_urls, discrepancy_reason,
        can_be_diverted_to_waste, confirmed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      RETURNING *;
    `;

    const confirmationValues = [
      taskId,
      user.id,
      dto.receivedQuantity,
      dto.damagedQuantity ?? 0,
      dto.missingQuantity ?? 0,
      dto.quantityUnit,
      dto.recipientNotes || null,
      dto.evidenceUrls || [],
      dto.discrepancyReason || null,
      dto.canBeDivertedToWaste ?? false,
    ];

    const confirmation = await this.db.queryOne(confirmationSql, confirmationValues);

    const hasDiscrepancy = (dto.damagedQuantity ?? 0) > 0 || (dto.missingQuantity ?? 0) > 0;

    await this.safechain.recordEvent({
      batchId: task.batch_id,
      allocationId: task.allocation_id,
      deliveryId: taskId,
      eventType: hasDiscrepancy ? 'delivery_discrepancy_reported' : 'delivered',
      description: hasDiscrepancy
        ? `Delivery completed with reported discrepancy: Received ${dto.receivedQuantity}, Damaged ${dto.damagedQuantity}, Missing ${dto.missingQuantity} ${dto.quantityUnit}`
        : `Delivery successfully fulfilled: Received ${dto.receivedQuantity} ${dto.quantityUnit}`,
      recordedBy: user.id,
      eventData: {
        deliveryTaskId: taskId,
        receivedQuantity: dto.receivedQuantity,
        damagedQuantity: dto.damagedQuantity,
        missingQuantity: dto.missingQuantity,
        evidenceCount: (dto.evidenceUrls || []).length,
      },
    });

    return {
      message: 'Delivery milestone successfully recorded and verified.',
      confirmation,
      hasDiscrepancy,
    };
  }

  async getDeliveryById(taskId: string, user: AuthUser): Promise<any> {
    const delivery = await this.db.queryOne(
      `
      SELECT 
        dt.*,
        a.batch_id,
        a.allocated_quantity,
        a.quantity_unit as allocation_unit,
        b.food_name,
        b.batch_code,
        b.category as batch_category,
        donor.name as donor_name,
        donor.address as donor_address,
        ro.name as recipient_name,
        ro.address as recipient_address,
        p.full_name as volunteer_name,
        p.phone as volunteer_phone,
        dc.id as confirmation_id,
        dc.received_quantity,
        dc.damaged_quantity,
        dc.missing_quantity,
        dc.discrepancy_status,
        dc.discrepancy_reason,
        dc.evidence_urls as confirmation_evidence
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      LEFT JOIN public.profiles p ON p.id = dt.volunteer_id
      LEFT JOIN public.delivery_confirmations dc ON dc.delivery_task_id = dt.id
      WHERE dt.id = $1;
      `,
      [taskId],
    );

    if (!delivery) {
      throw new NotFoundException(`Delivery task with ID "${taskId}" was not found.`);
    }

    return delivery;
  }

  async listDeliveries(query: DeliveryQueryDto, user: AuthUser): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];
    let pIdx = 1;

    // Tenant isolation
    if (user.role !== AppRole.ADMIN) {
      if (user.role === AppRole.VOLUNTEER) {
        whereClauses.push(`(dt.volunteer_id = $${pIdx} OR dt.volunteer_id IS NULL)`);
        values.push(user.id);
        pIdx++;
      } else if (user.organisationId) {
        whereClauses.push(
          `(a.recipient_organisation_id = $${pIdx} OR b.donor_organisation_id = $${pIdx})`,
        );
        values.push(user.organisationId);
        pIdx++;
      }
    }

    if (query.status) {
      whereClauses.push(`dt.status = $${pIdx++}`);
      values.push(query.status);
    }

    if (query.volunteerId) {
      whereClauses.push(`dt.volunteer_id = $${pIdx++}`);
      values.push(query.volunteerId);
    }

    if (query.allocationId) {
      whereClauses.push(`dt.allocation_id = $${pIdx++}`);
      values.push(query.allocationId);
    }

    const whereSql = whereClauses.join(' AND ');

    const countRes = await this.db.queryOne<{ total: number }>(
      `
      SELECT count(*)::int as total
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      WHERE ${whereSql};
      `,
      values,
    );
    const total = countRes ? countRes.total : 0;

    const dataSql = `
      SELECT 
        dt.*,
        a.batch_id,
        a.allocated_quantity,
        a.quantity_unit,
        b.food_name,
        b.batch_code,
        donor.name as donor_name,
        ro.name as recipient_name,
        p.full_name as volunteer_name
      FROM public.delivery_tasks dt
      JOIN public.food_allocations a ON a.id = dt.allocation_id
      JOIN public.food_batches b ON b.id = a.batch_id
      JOIN public.organisations donor ON donor.id = b.donor_organisation_id
      JOIN public.organisations ro ON ro.id = a.recipient_organisation_id
      LEFT JOIN public.profiles p ON p.id = dt.volunteer_id
      WHERE ${whereSql}
      ORDER BY dt.created_at DESC
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
}
